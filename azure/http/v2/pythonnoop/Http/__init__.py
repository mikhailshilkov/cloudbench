import os
import random
import string
import azure.functions as func

#import sys
#import logging

#instance = "?"
#try:
#    file = open('/proc/self/cgroup', 'r') 
#    instance = buf
#except:
#    msg = sys.exc_info()[0]
#    logging.info(str(msg))
#    instance = str(msg)
#instance = 'AZL:' + os.environ['WEBSITE_INSTANCE_ID']

instance = 'RAND:' + ''.join(random.choice(string.ascii_letters) for m in range(9))
count = 0

def main(req: func.HttpRequest) -> func.HttpResponse:
    global count
    count = count + 1

    body = 'Azure_PythonNoop_{}'.format(instance)
    return func.HttpResponse(
        body,
        status_code=200,
        headers={ 'Content-Type': 'text/plain',
                  'X-CB-Name': 'Azure_PythonNoop',
                  'X-CB-Count': str(count),
                  'X-CB-Instance': instance })
