export function orderedEffects(): Promise<string[]> {
  const order: string[] = [];
  return new Promise<string[]>((resolve) => {
    setTimeout(() => {
      order.push("macrotask");
      resolve(order);
    }, 0);
    queueMicrotask(() => order.push("microtask"));
    order.push("sync");
  });
}
