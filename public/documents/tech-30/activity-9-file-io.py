print("Q1")
f = open("display.txt", "w")
f.write("Welcome to TECH 30\n")
f.close()

f = open("display.txt", "r")
print(f.read())
f.close()


print("Q2")
usr = input("Enter a line to add to display.txt: ")

f = open("display.txt", "a")
f.write(usr + "\n")
f.close()

f = open("display.txt", "r")
print(f.read())
f.close()


print("Q3")
f = open("addresses.txt", "w")
f.write("192.168.1.255\n")
f.write("192.168.1.254\n")
f.write("192.168.1.253\n")
f.write("192.168.1.252\n")
f.write("192.168.1.251\n")
f.write("192.168.1.250\n")
f.write("192.168.1.249\n")
f.write("192.168.1.248\n")
f.write("192.168.1.247\n")
f.write("192.168.1.246\n")
f.close()


def print_ip():
    count = 0
    f = open("addresses.txt", "r")
    for line in f:
        if count == 4:
            break
        print(line.rstrip())
        count = count + 1
    f.close()


print_ip()
