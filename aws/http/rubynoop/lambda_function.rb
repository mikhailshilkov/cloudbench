require 'json'

$lines = File.readlines('/proc/self/cgroup')
$line = $lines[$lines.length - 3]
$parts = $line.split('/')
$instance = 'AWS:' + $parts[1][8..-2]
$memory = ENV['AWS_LAMBDA_FUNCTION_MEMORY_SIZE']
$count = 0

def lambda_handler(event:, context:)
    $count = $count + 1
    { 
        statusCode: 200, 
        body: 'AWS_RubyNoop_' + $memory + '_' + $instance,
        headers: {
            'Content-Type': 'text/plain',
            'X-CB-Name': 'AWS_RubyNoop_' + $memory,
            'X-CB-Memory': $memory,
            'X-CB-Count': $count,
            'X-CB-Instance': $instance
        }
    }
end
