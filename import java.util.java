import java.util.Scanner;

class Student {
    int rollno;
    String name;
    float marks;

    void display() {
        System.out.println("Student Details:");
        System.out.println("Roll Number: " + rollno);
        System.out.println("Name: " + name);
        System.out.println("Marks: " + marks);
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        Student s = new Student();

        System.out.print("Enter Roll Number: ");
        s.rollno = sc.nextInt();

        sc.nextLine(); // Consume the newline character

        System.out.print("Enter Name: ");
        s.name = sc.nextLine();

        System.out.print("Enter Marks: ");
        s.marks = sc.nextFloat();

        s.display();

        sc.close();
    }
}