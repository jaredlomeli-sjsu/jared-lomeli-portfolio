#Question 1
colors = ("red", "green", "blue")
print(colors[0])

#Question 2
numbers = [10, 20, 30, 40, 50]
print(numbers[1])
numbers.append("apple")
print(numbers)

#Question 3
number_set = {1, 2, 3, 4}
number_set.add(2)
print(number_set)  # The addition of 2 did not change the set.

#Question 4
set_a = {1, 2, 3}
set_b = {3, 4, 5}
print(set_a.union(set_b))

#Question 5
person = {"name": "Jared", "age": 19, "city": "San Jose"}
print(person["city"])