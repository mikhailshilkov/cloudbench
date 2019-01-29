package example;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.BufferedReader;
import java.io.Writer;

import java.util.UUID;
import java.util.List;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;

import com.amazonaws.services.lambda.runtime.RequestStreamHandler;
import com.amazonaws.services.lambda.runtime.Context; 
import com.amazonaws.services.lambda.runtime.LambdaLogger;

import org.json.simple.JSONObject;
import org.json.simple.JSONArray;

public class Hello implements RequestStreamHandler {

    private String instance = null;
    private String memory = null;
    private Integer count = 0;

    public Hello() throws IOException {
        List<String> lines = Files.readAllLines(Paths.get("/proc/self/cgroup"), StandardCharsets.UTF_8);
        String line = lines.get(lines.size() - 3);
        String[] parts = line.split("/");
        this.instance = "AWS:" + parts[1].substring(8);
        this.memory = System.getenv("AWS_LAMBDA_FUNCTION_MEMORY_SIZE");
    }

    public void handleRequest(InputStream inputStream, OutputStream outputStream, Context context) throws IOException {
        this.count += 1;

        JSONObject responseJson = new JSONObject();

        responseJson.put("isBase64Encoded", false);
        responseJson.put("statusCode", "200");
        responseJson.put("body", "AWS_JavaNoop_" + this.memory + "_" + this.instance);  

        JSONObject headers = new JSONObject();
        headers.put("Content-Type", "text/plain");
        headers.put("X-CB-Name", "AWS_JavaNoop_" + this.memory);
        headers.put("X-CB-Count", count.toString());
        headers.put("X-CB-Instance", this.instance);
        responseJson.put("headers", headers);

        OutputStreamWriter writer = new OutputStreamWriter(outputStream, "UTF-8");
        writer.write(responseJson.toJSONString());  
        writer.close();
    }
}
