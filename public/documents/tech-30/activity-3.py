# Q1 
# Chained statements check a series of conditions and stops at the first True statement and executes the respective code block. 
# Chained
x = 15
if x < 10:
    print ("Smaller than 10")
elif x < 20:
    print ("Larger than 10 but smaller than 20")
else:
    print ("Larger than 20")

# Nested statements use "if" statements inside other "if" statements. The secondary "if" statement is only checked if the first "if" statement is True.
x = 15
if x > 5:
    print("Greater than 5")
    if x < 20:
        print("Smaller than 20")

# The Difference between chained and nested statements is that chained statements are read linearly and stop at the first True statement
# Nested statements are read in the same fashion but stop at the first False statement.
# Q2 
age = int(input("What is your age? "))
if age >= 16:
    print("You are allowed to drive.")

# Q3
password = input("Enter your password: ")
length = len(password)
if length < 6:
    print("Weak")
elif length <= 8:
    print("Too short")
else:
    print("Strong enough.")
