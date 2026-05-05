function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeCpf(value: string) {
  return onlyDigits(value);
}

export function isValidCpf(value: string) {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false;
  }

  const digits = cpf.split("").map(Number);
  const firstVerifier =
    ((digits.slice(0, 9).reduce((sum, digit, index) => sum + digit * (10 - index), 0) * 10) % 11) % 10;
  const secondVerifier =
    ((digits.slice(0, 10).reduce((sum, digit, index) => sum + digit * (11 - index), 0) * 10) % 11) % 10;

  return firstVerifier === digits[9] && secondVerifier === digits[10];
}
