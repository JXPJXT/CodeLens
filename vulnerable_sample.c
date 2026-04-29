#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void process_data(char *input) {
    char buffer[16];
    
    // BUG: Potential Buffer Overflow
    // If input is longer than 15 chars, it will overflow the buffer
    strcpy(buffer, input);
    printf("Buffer content: %s\n", buffer);
}

void risky_operation() {
    int *ptr = NULL;
    
    // BUG: Null Pointer Dereference
    // This will cause a segmentation fault
    *ptr = 100;
}

void memory_leak_demo() {
    char *data = (char *)malloc(100 * sizeof(char));
    if (data == NULL) return;
    
    strcpy(data, "Sample data");
    printf("%s\n", data);
    
    // BUG: Memory Leak
    // The allocated memory is never freed before the function returns
}

int main(int argc, char *argv[]) {
    if (argc > 1) {
        process_data(argv[1]);
    }
    
    // Un-comment these to trigger crashes
    // risky_operation();
    // memory_leak_demo();
    
    return 0;
}
