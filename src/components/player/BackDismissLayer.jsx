import useBackDismiss from '@/hooks/useBackDismiss';

/** Görünür olduğu sürece cihazın geri tuşunu kendi kapatma işlevine bağlar. */
export default function BackDismissLayer({ onClose }) {
  useBackDismiss(true, onClose);
  return null;
}