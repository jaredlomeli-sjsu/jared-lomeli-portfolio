#Q1
total = 0
numbers = [4,8,15,16,23]
for num in numbers:
    total = total + num
average = total / len(numbers)
print('Average:', average)

#Q2
num1 = int(input('Enter an integer: '))
if num1 % 3 == 0 and num1 % 5 == 0:
    print('Divisible by both 3 and 5')
elif num1 % 3 == 0:
    print('Divisible by 3')
elif num1 %5 == 0:
    print('Divisible by 5')
else:
    print('Not divisible by 3 or 5')

#Q3
n = int(input('Enter a positive integer: '))
total_sum = 0
for i in range(1, n + 1):
    total_sum = total_sum + i
print('Sum from 1 to', n, 'is:', total_sum)

even_sum = 0
for i in range(1, n + 1):
    if i % 2 == 0:
        even_sum = even_sum + i
print('Sum of even numbers from 1 to', n, 'is:', even_sum)