import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Rótulo usado na mensagem de fallback (ex: "o mapa"). */
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Última linha de defesa contra tela branca: React só recupera de erros de render através de
 * um Error Boundary de classe (não existe equivalente em hook). Sem isso, um erro em qualquer
 * componente da árvore (ex: uma falha do WebGL do MapLibre, um dado de API em formato
 * inesperado) derruba a aplicação inteira sem nenhuma explicação pro usuário.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Erro não tratado capturado pelo ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
          <h1 className="text-lg font-semibold">
            Ocorreu um erro inesperado{this.props.label ? ` em ${this.props.label}` : ""}.
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Isso não deveria acontecer. Tente recarregar a página — se o problema continuar,
            entre em contato com o suporte.
          </p>
          <Button onClick={() => window.location.reload()}>Recarregar página</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
