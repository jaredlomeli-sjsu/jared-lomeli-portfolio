# Q1. Take a string as an input from the user. Display the number of "a" in the string entered by the user.

input1 = input("Enter a Long String: ")
count = 0

for i in input1:
    if i == 'a':
        count = count + 1

print(count)

#Q2. Take a string as an input from the user. Split the string using "t" as a delimiter. Show the output. Also show what is the new data type of this output.

input2 = input("Enter a String :")
split_input2 = input2.split('t')

print(split_input2)