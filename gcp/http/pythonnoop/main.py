import os
import random
import string

instance = 'RAND:' + ''.join(random.choice(string.ascii_letters) for m in range(9))

memory = os.environ['FUNCTION_MEMORY_MB']
count = 0

def handler(request): 
    global count
    count = count + 1

    body = 'GCP_PythonNoop_{}_{}'.format(memory, instance)
    headers = {
        'Content-Type': 'text/plain',
        'X-CB-Name': 'GCP_PythonNoop_{}'.format(memory),
        'X-CB-Count': count,
        'X-CB-Instance': instance
    }

    return (body, 200, headers)
