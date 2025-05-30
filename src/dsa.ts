// export function dsa() {
  /// ============================= Linear Search =============================
  // const target = 5;
  // const ls = [4, 1, 0, 1, 5, 10, 4];
  // for (const num of ls) {
  //   if (num === target) {
  //     console.log("Found target!");
  //     break;
  //   }
  // }

  /// ============================= Binary Search =============================
  // const target = 5;
  // const ls = [0, 1, 4, 4, 5, 10, 11];

  // const binarySearch = (arr: number[], target: number) => {
  //   let left = 0;
  //   let right = arr.length - 1;

  //   while (left <= right) {
  //     const mid = left + Math.floor((right - left) / 2);

  //     if (arr[mid] === target) {
  //       return mid;
  //     } else if (arr[mid] < target) {
  //       left = mid + 1;
  //     } else {
  //       right = mid - 1;
  //     }
  //   }

  //   return -1;
  // };

  // const result = binarySearch(ls, target);
  // console.log(result);

  /// ============================= Bubble Sort =============================
  // const arr = [4, 5, 4, 10, 0, -3, 5, 6];
  // const n = arr.length;
  // for (let i = 0; i < n - 1; i++) {
  //   for (let j = 0; j < n - 1 - i; j++) {
  //     if (arr[j] > arr[j + 1]) {
  //       const temp = arr[j];
  //       arr[j] = arr[j + 1];
  //       arr[j + 1] = temp;
  //     }
  //   }
  // }
  // console.log(arr);

  /// ============================= Quick Sort =============================
  // const partition = (arr: number[], low: number, high: number): number => {
  //   // Assume the last element as pivot.
  //   let pivot = arr[high];
  //   let i = low - 1;

  //   for (let j = low; j < high; j++) {
  //     if (arr[j] <= pivot) {
  //       i++;
  //       const temp = arr[i];
  //       arr[i] = arr[j];
  //       arr[j] = temp;
  //     }
  //   }

  //   const t = arr[i + 1];
  //   arr[i + 1] = arr[high];
  //   arr[high] = t;

  //   return i + 1;
  // };

  // const quicksort = (arr: number[], low: number, high: number): void => {
  //   if (low < high) {
  //     const p = partition(arr, low, high);
  //     quicksort(arr, low, p - 1);
  //     quicksort(arr, p + 1, high);
  //   }
  // };

  // const arr = [4, 5, 4, 5, -3, 0, 10];
  // quicksort(arr, 0, arr.length - 1);

  // console.log(arr);

  // const fibo = (n: number): number[] => {
  //   let a = 0;
  //   let b = 1;
  //   const result = [];

  //   for (let i = a; i < n; i++) {
  //     result.push(a);
  //     const next = a + b;
  //     a = b;
  //     b = next;
  //   }

  //   return result;
  // };

  // console.log(fibo(10));

  // const isPalindrome = (str: string) => {
  //   if (str.length === 0) {
  //     throw Error("Empty string passed.");
  //   }
  //   str = str.toLowerCase().replace(/[^a-z0-9]/g, "");

  //   let a = 0;
  //   let b = str.length - 1;

  //   while (a < b) {
  //     if (str[a] !== str[b]) return false;
  //     a++;
  //     b--;
  //   }

  //   return true;
  // };

  // console.log(isPalindrome("Madam")); // true
  // console.log(isPalindrome("No lemon, no melon")); // true
  // console.log(isPalindrome("Hello")); // false

  // const factorial = (n: number) => {
  //   if (n <= 0) {
  //     throw new Error("Number cannot be less than or equal to zero.");
  //   }

  //   let result = 1;
  //   for (let i = n; i >= 1; i--) {
  //     result *= i;
  //   }

  //   return result;
  // };

  // console.log(factorial(5));

  // const reverseNumber = (orgNum: number): number => {
  //   let reversed = 0;
  //   let num = Math.abs(orgNum);

  //   while (num > 0) {
  //     const lastDigit = num % 10;
  //     reversed = reversed * 10 + lastDigit;
  //     num = Math.floor(num / 10);
  //   }

  //   return orgNum > 0 ? reversed : -reversed;
  // };

  // console.log(reverseNumber(1234)); // 4321
  // console.log(reverseNumber(-456)); // -654
  // console.log(reverseNumber(1000)); // 1

  // const reverseString = (str: string) => {
  //   let reversed = "";

  //   for (let i = str.length - 1; i >= 0; i--) {
  //     reversed += str[i];
  //   }

  //   return reversed;
  // };

  // console.log(reverseString("Hello"));

  /// ============================= Linked List =============================
  // class Node {
  //   val: number;
  //   next: Node | null;

  //   constructor(val: number) {
  //     this.val = val;
  //     this.next = null;
  //   }
  // }

  // const head = new Node(1);
  // head.next = new Node(2);
  // head.next.next = new Node(3);
  // head.next.next.next = new Node(4);

  // function reverseListIterative(head: Node | null): Node | null {
  //   let prev: Node | null = null;
  //   let curr: Node | null = head;

  //   while (curr !== null) {
  //     const nextTemp = curr.next; // store next
  //     curr.next = prev; // reverse pointer
  //     prev = curr; // move prev forward
  //     curr = nextTemp; // move curr forward
  //   }

  //   return prev; // prev is new head
  // }

  // let rev = reverseListIterative(head);

  // while (rev !== null) {
  //   console.log(rev.val);
  //   rev = rev.next;
  // }
// }
