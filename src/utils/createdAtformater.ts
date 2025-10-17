function formatDate(date: any) {
  if (!date) return null;
  return `${date.getDate()}/${date.toLocaleString("default", {
    month: "long",
  })}/${date.getFullYear()} ${date.toLocaleTimeString()}`;
}
export { formatDate };
