package io.mikhail;

import java.util.*;
import com.microsoft.azure.functions.annotation.*;
import com.microsoft.azure.functions.*;
import org.mindrot.jbcrypt.*;

/**
 * Azure Functions with HTTP Trigger.
 */
public class Function {
    @FunctionName("v2java")
    public HttpResponseMessage run(
            @HttpTrigger(name = "req", methods = {HttpMethod.GET}, authLevel = AuthorizationLevel.ANONYMOUS) HttpRequestMessage<Optional<String>> request,
            final ExecutionContext context) {
        return request.createResponseBuilder(HttpStatus.OK).body("AzureFunction_V2_Java").build();
    }

    @FunctionName("v2javapause")
    public HttpResponseMessage runpause(
            @HttpTrigger(name = "req", methods = {HttpMethod.GET}, authLevel = AuthorizationLevel.ANONYMOUS) HttpRequestMessage<Optional<String>> request,
            final ExecutionContext context) throws InterruptedException {
        Thread.sleep(100);
        return request.createResponseBuilder(HttpStatus.OK).body("AzureFunction_V2_Java_Pause").build();
    }

    @FunctionName("v2javabcrypt")
    public HttpResponseMessage runbcrypt(
            @HttpTrigger(name = "req", methods = {HttpMethod.GET}, authLevel = AuthorizationLevel.ANONYMOUS) HttpRequestMessage<Optional<String>> request,
            final ExecutionContext context) throws InterruptedException {
        String randomString = UUID.randomUUID().toString();
        BCrypt.hashpw(randomString, BCrypt.gensalt(9));
        return request.createResponseBuilder(HttpStatus.OK).body("AzureFunction_V2_Java_Bcrypt").build();
    }
}
