export function useConfirm(): { confirmAction: (message: string) => boolean } {
  return {
    confirmAction(message: string): boolean {
      return window.confirm(message);
    },
  };
}
