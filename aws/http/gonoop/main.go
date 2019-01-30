package main

import (
 "github.com/aws/aws-lambda-go/events"
 "github.com/aws/aws-lambda-go/lambda"
 "bufio"
 "os"
 "strconv"
 "strings"
)

func readLines(path string) ([]string) {
  file, err := os.Open(path)
  if err != nil {
    return nil
  }
  defer file.Close()

  var lines []string
  scanner := bufio.NewScanner(file)
  for scanner.Scan() {
    lines = append(lines, scanner.Text())
  }
  return lines
}

var instance = ""
var memory = ""
var count = 0

// Handler is your Lambda function handler
// It uses Amazon API Gateway request/responses provided by the aws-lambda-go/events package,
// However you could use other event sources (S3, Kinesis etc), or JSON-decoded primitive types such as 'string'.
func Handler(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
 count = count + 1
 
 return events.APIGatewayProxyResponse{
  Body:       "AWS_GoNoop_" + memory + "_" + instance,
  StatusCode: 200,
  Headers:    map[string]string{
   "Content-Type": "text/plain",
   "X-CB-Name": "AWS_GoNoop_" + memory,
   "X-CB-Count": strconv.Itoa(count),
   "X-CB-Instance": instance,
  },
 }, nil
}

func main() {
 var lines = readLines("/proc/self/cgroup")
 var line = lines[len(lines)-3]
 var parts = strings.Split(line, "/")

 instance = "AWS:" + parts[1][8:]
 memory = os.Getenv("AWS_LAMBDA_FUNCTION_MEMORY_SIZE")

 lambda.Start(Handler)
}
