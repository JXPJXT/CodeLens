ZERO_SHOT_TEMPLATE = """You are a senior software engineer.
Review the following {language} code and identify any bugs, security risks, or bad practices.
Suggest specific fixes.

Code:
{code}

Review:"""

ONE_SHOT_TEMPLATE = """You are a senior software engineer.
Here is an example of a code review:

Example code:
{example_code}

Example review:
{example_review}

Now review this {language} code:
{code}

Review:"""

FEW_SHOT_TEMPLATE = """You are a senior software engineer.
Here are three examples of code reviews:

[Example 1]
Code: {ex1_code}
Review: {ex1_review}

[Example 2]
Code: {ex2_code}
Review: {ex2_review}

[Example 3]
Code: {ex3_code}
Review: {ex3_review}

Now review this {language} code:
{code}

Review:"""

EXAMPLES = [
    {
        "code": "char buf[10];\ngets(buf);",
        "review": "The code uses the `gets` function, which is insecure and vulnerable to buffer overflows because it does not check the length of the input. Use `fgets` instead, specifying the maximum number of characters to read."
    },
    {
        "code": "int *ptr = malloc(sizeof(int));\n*ptr = 10;\nreturn 0;",
        "review": "Memory allocated with `malloc` is never freed, resulting in a memory leak. You should call `free(ptr)` before the function returns."
    },
    {
        "code": "if (password == 'secret') {\n  login();\n}",
        "review": "Hardcoding credentials like passwords in source code is a major security risk. Use environment variables or a secure vault to manage secrets."
    }
]
