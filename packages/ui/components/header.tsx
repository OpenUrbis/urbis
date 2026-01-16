interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => {
  return (
    <header id="header">
      <h1>{title}</h1>
    </header>
  );
};
