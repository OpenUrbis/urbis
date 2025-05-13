import { Button } from '@rmwc/button';
import '@rmwc/button/styles';
import { useNavigationContext } from '../../hooks/useNavigationContext';

export const BackButton = () => {
  const { navigatePop } = useNavigationContext();

  return (
    <Button
      outlined
      icon="arrow_back"
      label="Voltar"
      onClick={() => navigatePop()}
      style={{
        borderRadius: '4px',
        textTransform: 'none',
        fontWeight: 500,
      }}
    />
  );
};