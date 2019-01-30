package helloworld

import (
    "fmt"
    "net/http"
    "time"
    "math/rand"
    "strconv"
    "os"
)

var instance = ""
var memory = ""
var count = 0

var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

func randSeq(n int) string {
    b := make([]rune, n)
    for i := range b {
        b[i] = letters[rand.Intn(len(letters))]
    }
    return string(b)
}


func init() {
    rand.Seed(time.Now().UnixNano())
    instance = "RAND:" + randSeq(9)
    memory = os.Getenv("FUNCTION_MEMORY_MB")
}

func Handler(w http.ResponseWriter, r *http.Request) {
    count = count + 1
       
    w.Header().Set("Content-Type", "text/plain")
    w.Header().Set("X-CB-Name", "GCP_GoNoop_" + memory)
    w.Header().Set("X-CB-Count", strconv.Itoa(count))
    w.Header().Set("X-CB-Instance", instance)
    fmt.Fprintf(w, "GCP_GoNoop_" + memory + "_" + instance)
}
