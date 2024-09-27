export function v4(): string {
  const hex = "0123456789abcdef";
  let uuid = "";

  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += "-";
    } else if (i === 14) {
      uuid += "4"; // Version 4 UUID always has the 14th character as '4'
    } else if (i === 19) {
      uuid += hex[(Math.random() * 4) | 8]; // 8, 9, A, or B
    } else {
      uuid += hex[(Math.random() * 16) | 0];
    }
  }

  return uuid;
}
