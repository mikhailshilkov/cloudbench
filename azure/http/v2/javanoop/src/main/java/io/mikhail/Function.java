package io.mikhail;

import java.util.*;
import com.microsoft.azure.functions.annotation.*;
import com.microsoft.azure.functions.*;

public class Function {
    private String instance = null;
    private static Integer count = 0;

    public Function() {
        this.instance = "AZ:" + System.getenv("WEBSITE_INSTANCE_ID");
    }

    @FunctionName("http")
    public HttpResponseMessage run(
            @HttpTrigger(name = "req", methods = {HttpMethod.GET}, authLevel = AuthorizationLevel.ANONYMOUS) HttpRequestMessage<Optional<String>> request,
            final ExecutionContext context) {

        count += 1;


        return request
            .createResponseBuilder(HttpStatus.OK)
            .body("Azure_JavaNoop_" + this.instance)
            .header("Content-Type", "text/plain")
            .header("X-CB-Name", "Azure_JavaNoop")
            .header("X-CB-Count", count.toString())
            .header("X-CB-Instance", this.instance)
            .build();
    }
}
