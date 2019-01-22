import os

file = open('/proc/self/cgroup', 'r') 
buf = file.read() 
buf = buf.split("\n")
buf = buf[len(buf) - 3]
instance = buf.split("/")[1][13:]

memory = os.environ['AWS_LAMBDA_FUNCTION_MEMORY_SIZE']
count = 0

def handler(event, context): 
    global count
    count = count + 1

    body = 'AWS_PythonNoop_{}_{}'.format(memory, instance)
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/plain',
            'X-CB-Name': 'AWS_PythonNoop_{}'.format(memory),
            'X-CB-Count': count,
            'X-CB-Instance': instance
        },
        'body': body
    }
