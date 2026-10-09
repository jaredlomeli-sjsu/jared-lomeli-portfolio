# Defining a function
def func1():
    print('welcome')
    print('to')
    print('tech 30')

# calling a function
func1()

# Functions are used to organize code into reusable blocks
# They help in reducing code duplication and improving readability


#Q1
numbers = list(range(100)) * 50
counts = {}
for n in numbers:
    if n in counts:
        counts[n] += 1
    else:
        counts[n] = 1
print(counts)




#Q2
books = {'book i' : 8, 'book ii' : 3, 'book iii' : 12, 'book iiii' : 10}

user_input = input("Would you like to buy a book? Enter y or n: ")
while user_input == 'y':
    print('Available books:')
    for book, quantity in books.items():
        print(f"{book}: {quantity}")
    selected_book = input('Enter the name of the book you want to purchase: ')
    if selected_book in books and books[selected_book] > 0:
      books[selected_book] -= 1
      print(f'You bought {selected_book}. {books[selected_book]} are left.')
    user_input = input("Would you like to buy another book? Enter y or n: ")
    if user_input == 'y':
        pass
    else:
        print('Goodbye')
else:
    print(f'Sorry, {selected_book} is out of stock.')
if user_input == 'n':
    print('Goodbye')


