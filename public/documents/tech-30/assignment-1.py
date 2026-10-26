#Q.1 Write a program that uses a for loop to reverse a given string. For example, if the input is "hello", the program should output "olleh". [10 points]
string1 = input("Enter a string: ")
reversed_text = ""
for ch in string1:
    reversed_text = ch + reversed_text
print("Q.1:")
print(reversed_text)


#Q.2 Write a Python program that checks whether a given year is a leap year. Take the year as a user input. A leap year is divisible by 4, but not divisible by 100 unless it is also divisible by 400. The program should return True if the year is a leap year and False otherwise. [10 points]
def is_leap_year(year):
    return year % 4 == 0 and year % 100 != 0 or year % 400 == 0

year = int(input("Enter a year: "))
if is_leap_year(year):
    print("Q.2:")
    print("True")
else:
    print("Q.2:")
    print("False")

#Q.3 Write a Python program that takes a list of integers with 6 elements and returns a new list with the 1st, 3rd, and 5th elements. For example, given the list [1, 2, 3, 4, 5, 6], the program should return [1, 3, 5]. [10 points]
numbers = [1, 2, 3, 4, 5, 6]
result = numbers[0], numbers[2], numbers[4]
print("Q.3:")
print(list(result))

#Q.4 Write a Python program that finds and prints the largest and smallest elements in a given list of numbers. You can hard-code the elements of the list. For the list [12, 45, 23, 56, 78, 34], the program should print Largest element: 78 and Smallest element: 12. [5 points]
numbers = [12, 45, 23, 56, 78, 34]
print("Q.4:")
print("Largest element:", max(numbers))
print("Smallest element:", min(numbers))

#Q.5 Write a Python program to create a new list that contains the squares of all the odd numbers from 1 to 20. The resulting list should look like [1, 9, 25, 49, 81, 121, 169, 225, 289, 361]. [10 points]
squares = []
for n in range(1, 21):
    if n % 2 == 1:
        squares.append(n ** 2)
print("Q.5:")
print(squares)

#Q.6 Write a Python program to calculate the total pay of an employee based on their regular and overtime hours worked. The program should ask for regular hours (0–40), overtime hours (above 40), and the hourly rate. Regular pay is rate × regular hours. Overtime pay is rate × 1.5 × overtime hours. Total pay is the sum. The program should display an appropriate error message for invalid input (negative or non-numeric values). The pay calculation must be done within a function. [20 points]
def calculate_pay(regular_hours, overtime_hours, hourly_rate):
    regular_pay = regular_hours * hourly_rate
    overtime_pay = overtime_hours * hourly_rate * 1.5
    return regular_pay + overtime_pay

try:
    regular = float(input("Regular hours worked (0-40): "))
    overtime = float(input("Overtime hours worked (above 40): ")) 
    rate = float(input("Hourly rate: "))
    

    if regular < 0 or regular > 40:
        print("Error: Regular hours must be between 0 and 40.")
        if regular < 40 and overtime > 0:
            print("Error: Overtime hours should be 0 if regular hours are less than 40.")
    elif overtime < 0:
        print("Error: Overtime hours cannot be negative.")
    elif rate < 0:
        print("Error: Hourly rate cannot be negative.")
    else:
        total_pay = calculate_pay(regular, overtime, rate)
        print(f"Total pay: ${total_pay}")

except ValueError:
    print("Error: Please enter valid numeric values for hours and rate.")

#Q.7 Write a Python program that uses two sets and prints the symmetric difference ofthe two sets, which includes all elements that are in either of the sets but not in both. [10 points]
set_a = {1, 2, 3, 4}
set_b = {3, 4, 5, 6}
print(set_a.symmetric_difference(set_b)) 

#Q.8 Consider that you’re writing a small script to analyze connectionlogs from an officenetwork. You have a dictionary that maps port numbersto service names, and a list of logged connections as (ip_address,port) tuples. [25 points]
port_services = {22: "SSH", 80: "HTTP", 443: "HTTPS"}
connections = [("192.168.1.10", 22), ("192.168.1.15", 80), ("192.168.1.10", 443), ("192.168.1.20", 3389), ("192.168.1.15", 80), ("192.168.1.10", 80)]

#1. 
port_services[53] = "DNS"
port_services[3389] = "RDP"

#2.
host_ports = {}
for ip, port in connections:
    if ip not in host_ports:
        host_ports[ip] = []
    if port not in host_ports[ip]:
        host_ports[ip].append(port)

#3.
service_counts = {}
for ip, port in connections:
    service = port_services.get(port, "UNKNOWN")
    service_counts[service] = service_counts.get(service, 0) + 1

#4.
ssh_hosts = [ip for ip, ports in host_ports.items() if 22 in ports]

print(host_ports)
print(service_counts)
print(ssh_hosts)


#5. (multiple choice) Which of the following does NOT create a dictionary?
#a) config = {}
#b) config = dict()
#c) config = dict(router="10.0.0.1")
#d) config = {"router", "10.0.0.1"}

print('Answer: d. config = {"router", "10.0.0.1"}')

#5. (multiple choice) Which of these CANNOT be used as a dictionary key?
#a) "eth0"
#b) 443
#c) ("10.0.0.1", 80)
#d) ["10.0.0.1", 80]

print('Answer: d. ["10.0.0.1", 80]')