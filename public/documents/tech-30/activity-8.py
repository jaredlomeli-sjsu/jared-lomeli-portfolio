def greeting(studentname, enrolledclass):
    return f"Hi {studentname}, welcome to {enrolledclass}."
studentname = input("Enter your name: ")
enrolledclass = input("What class are you currently enrolled in?: ")
print(greeting(studentname, enrolledclass))


def apply_discount(price, discount):
    return price - discount
price = float(input('Enter the price of your item: '))
discount = float(input('Enter your discount: '))
if price - discount > 0:
    print(f"The final price after your discount is {apply_discount(price, discount)} dollars.")
else:
    print("Price cannot be negative.")
