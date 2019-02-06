import * as aws from "@pulumi/aws";
import { ComponentResource, Output, ResourceOptions, Input } from "@pulumi/pulumi";

export interface VpcInputs {
    description: string;
    baseTags: aws.Tags;

    baseCidr: string;
    azCount: number;

    zoneName?: string;
}

export interface VpcOutputs {
    vpcId: Output<string>;
    privateSubnetIds: Output<string>[];
    publicSubnetIds: Output<string>[];
    privateHostedZoneId: Output<string>;
}

function subnetV4(ipRange: string, newBits: number, netNum: number): string {
    const ipAddress = require("ip-address");
    const BigInteger = require("jsbn").BigInteger;

    const ipv4 = new ipAddress.Address4(ipRange);
    if (!ipv4.isValid()) {
        throw new Error(`Invalid IP address range: ${ipRange}`);
    }

    const newSubnetMask = ipv4.subnetMask + newBits;
    if (newSubnetMask > 32) {
        throw new Error(`Requested ${newBits} new bits, but ` +
            `only ${32 - ipv4.subnetMask} are available.`);
    }

    const addressBI = ipv4.bigInteger();
    const newAddressBase = Math.pow(2, 32 - newSubnetMask);
    const netNumBI = new BigInteger(netNum.toString());

    const newAddressBI = addressBI.add(new BigInteger(newAddressBase.toString()).multiply(netNumBI));
    const newAddress = ipAddress.Address4.fromBigInteger(newAddressBI).address;

    return `${newAddress}/${newSubnetMask}`;
}

/**
 * A SubnetDistributor is used to split a given CIDR block into a number of
 * subnets.
 */
class SubnetDistributor {
    private readonly _privateSubnets: string[];
    private readonly _publicSubnets: string[];

    /**
     * Returns a subnet distributor configured to split the baseCidr into one
     * pair of public/private subnets for each availability zone in the
     * provider-configured region.
     * @param {string} baseCidr The CIDR block on which to base subnet CIDRs
     * @returns {Promise<SubnetDistributor>} A SubnetDistributor instance.
     */
    public static async perAz(baseCidr: string): Promise<SubnetDistributor> {
        const azCount = (await aws.getAvailabilityZones({
            state: "available",
        })).names.length;

        return new SubnetDistributor(baseCidr, azCount);
    }

    /**
     * Returns a subnet distributor configured to split the baseCidr into a fixed
     * number of public/private subnet pairs.
     * @param {string} baseCidr The CIDR block to split.
     * @param {number} azCount The number of subnet pairs to produce.
     * @returns {SubnetDistributor} A SubnetDistributor instance.
     */
    public static fixedCount(baseCidr: string, azCount: number): SubnetDistributor {
        return new SubnetDistributor(baseCidr, azCount);
    }

    /** @internal */
    private constructor(baseCidr: string, azCount: number) {
        const newBitsPerAZ = Math.log2(nextPow2(azCount));

        const azBases = [...Array(azCount).keys()].map((_, index) => {
            return subnetV4(baseCidr, newBitsPerAZ, index);
        });

        this._privateSubnets = azBases.map((block) => {
            return subnetV4(block, 1, 0);
        });

        this._publicSubnets = this._privateSubnets.map((block) => {
            const splitBase = subnetV4(block, 0, 1);
            return subnetV4(splitBase, 2, 0);
        });
    }

    /**
     * Returns an array of the CIDR blocks for the private subnets.
     * @returns {string[]}
     */
    public privateSubnets(): string[] {
        return this._privateSubnets.slice();
    }

    /**
     * Returns an array of the CIDR blocks for the public subnets.
     * @returns {string[]}
     */
    public publicSubnets(): string[] {
        return this._publicSubnets.slice();
    }
}

/**
 * nextPow2 returns the next integer greater or equal to n which is a power of 2.
 * @param {number} n input number
 * @returns {number} next power of 2 to n (>= n)
 */
function nextPow2(n: number): number {
    if (n === 0) {
        return 1;
    }

    n--;
    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;

    return n + 1;
}

export class SmartVpc extends ComponentResource implements VpcOutputs {
    public vpcId: Output<string>;
    public privateSubnetIds: Output<string>[];
    public publicSubnetIds: Output<string>[];
    public privateHostedZoneId: Output<string>;
    public defaultSecurityGroupId: Output<string>;

    public constructor(name: string, inputs: VpcInputs, opts?: ResourceOptions) {
        super("operator-error:aws:Vpc", name, {}, opts);

        const instanceParent = {parent: this};

        const baseName = name.toLowerCase();

        // VPC
        const vpcTags = Object.assign({
            Name: `${inputs.description} VPC`,
        }, inputs.baseTags);
        const vpc = new aws.ec2.Vpc(`${baseName}-vpc`, {
            cidrBlock: inputs.baseCidr,
            enableDnsSupport: true,
            enableDnsHostnames: true,
            tags: vpcTags,
        }, instanceParent);
        this.vpcId = vpc.id;
        this.defaultSecurityGroupId = vpc.defaultSecurityGroupId;
        const vpcParent = {parent: vpc};

        // Private Hosted Zone
        if (inputs.zoneName) {
            const privateZone = new aws.route53.Zone(`${baseName}-private-hosted-zone`, {
                vpcId: vpc.id,
                name: inputs.zoneName,
                comment: `Private zone for ${inputs.zoneName}. Managed by Pulumi.`,
            }, vpcParent);
            this.privateHostedZoneId = privateZone.id;

            const dhcpOptionSetTags = Object.assign({
                Name: `${inputs.description} DHCP Options`,
            }, inputs.baseTags);
            const dhcpOptionSet = new aws.ec2.VpcDhcpOptions(`${baseName}-dhcp-options`, {
                domainName: "",
                domainNameServers: ["AmazonProvidedDNS"],
                tags: dhcpOptionSetTags,
            }, vpcParent);
            const dhcpOptionSetParent = {parent: dhcpOptionSet};

            new aws.ec2.VpcDhcpOptionsAssociation(`${baseName}-dhcp-options-assoc`, {
                vpcId: vpc.id,
                dhcpOptionsId: dhcpOptionSet.id,
            }, dhcpOptionSetParent);
        }

        // Internet Gateway
        const internetGatewayTags = Object.assign({
            Name: `${inputs.description} VPC IG`,
        }, inputs.baseTags);
        const internetGateway = new aws.ec2.InternetGateway(`${baseName}-igw`, {
            vpcId: vpc.id,
            tags: internetGatewayTags,
        }, vpcParent);

        // Subnet Distributor
        let distributor = SubnetDistributor.fixedCount(inputs.baseCidr, inputs.azCount);

        // Find AZ names
        const azNames = aws.getAvailabilityZones({ state: "available" });

        // Public Subnets
        const publicSubnets = distributor.publicSubnets().map((cidr, index) => {
            const subnetTags = Object.assign({
                Name: `${inputs.description} Public ${index + 1}`,
            }, inputs.baseTags);
            return new aws.ec2.Subnet(`${baseName}-public-${index + 1}`, {
                vpcId: vpc.id,
                cidrBlock: cidr,
                mapPublicIpOnLaunch: true,
                availabilityZone: azNames.then(v => v.names[index]),
                tags: subnetTags,
            }, vpcParent);
        });
        this.publicSubnetIds = publicSubnets.map(subnet => subnet.id);

        // Route Table for Public Subnets
        const defaultRouteTable = vpc.defaultRouteTableId.apply(rtb => aws.ec2.getRouteTable({
            routeTableId: rtb,
        }));

        const publicRouteTableTags = Object.assign({
            Name: `${inputs.description} Public RT`,
        }, inputs.baseTags);

        const publicRouteTable = new aws.ec2.DefaultRouteTable(`${baseName}-public-rt`, {
            defaultRouteTableId: defaultRouteTable.apply(rt => rt.id),
            tags: publicRouteTableTags,
        }, vpcParent);
        const publicRouteTableParent = {parent: publicRouteTable};

        new aws.ec2.Route(`${baseName}-route-public-sn-to-ig`, {
            routeTableId: defaultRouteTable.apply(prt => prt.id),
            destinationCidrBlock: "0.0.0.0/0",
            gatewayId: internetGateway.id,
        }, publicRouteTableParent);

        // Associate public route table with each public subnet
        publicSubnets.map(async (subnet, index) => {
            const subnetParent = {parent: subnet};
            return new aws.ec2.RouteTableAssociation(`${baseName}-public-rta-${index + 1}`, {
                subnetId: subnet.id,
                routeTableId: publicRouteTable.id,
            }, subnetParent);
        });

        // Private Subnets
        const privateSubnets = distributor.privateSubnets().map((cidr, index) => {
            const subnetTags = Object.assign({
                Name: `${inputs.description} Private ${index + 1}`,
            }, inputs.baseTags);
            return new aws.ec2.Subnet(`${baseName}-private-${index + 1}`, {
                vpcId: vpc.id,
                cidrBlock: cidr,
                mapPublicIpOnLaunch: false,
                availabilityZone: azNames.then(v => v.names[index]),
                tags: subnetTags,
            }, vpcParent);
        });
        this.privateSubnetIds = privateSubnets.map(subnet => subnet.id);

        // NAT Gateways for each private subnet
        // const privateRouteTables = privateSubnets.map((subnet, index) => {
        //     const subnetParent = {parent: subnet};
        //     const privateRouteTableTags = Object.assign({
        //         Name: `${inputs.description} Private RT ${index + 1}`,
        //     }, inputs.baseTags);
        //     const privateRouteTable = new aws.ec2.RouteTable(`${baseName}-private-rt-${index + 1}`, {
        //         vpcId: vpc.id,
        //         tags: privateRouteTableTags,
        //     }, subnetParent);

        //     const eipTags = Object.assign({
        //         Name: `${inputs.description} NAT EIP ${index + 1}`,
        //     }, inputs.baseTags);

        //     // Elastic IP
        //     const eip = new aws.ec2.Eip(`${baseName}-nat-eip-${index + 1}`, {
        //         tags: eipTags,
        //     }, subnetParent);

        //     // Create the NAT Gateway in the corresponding indexed PUBLIC subnet
        //     const natGatewayTags = Object.assign({
        //         Name: `${inputs.description} NAT GW ${index + 1}`,
        //     }, inputs.baseTags);
        //     const natGateway = new aws.ec2.NatGateway(`${baseName}-nat-gw-${index + 1}`, {
        //         allocationId: eip.id,
        //         subnetId: publicSubnets[index].id,
        //         tags: natGatewayTags,
        //     }, subnetParent);

        //     const privateRouteTableParent = {parent: privateRouteTable};
        //     new aws.ec2.Route(`${baseName}-route-private-sn-to-nat-${index + 1}`, {
        //         routeTableId: privateRouteTable.id,
        //         destinationCidrBlock: "0.0.0.0/0",
        //         gatewayId: natGateway.id,
        //     }, privateRouteTableParent);

        //     new aws.ec2.RouteTableAssociation(`${baseName}-private-rta-${index + 1}`, {
        //         subnetId: subnet.id,
        //         routeTableId: privateRouteTable.id,
        //     }, subnetParent);

        //     return privateRouteTable;
        // });
    }    
}