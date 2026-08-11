'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import styles from './Badge.module.css';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        styles.badge,
        styles[variant],
        styles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Status Badge específico para pipeline
export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: 'novo_cadastro' | 'aguardando_assinatura' | 'em_analise' | 'aprovado' | 'rejeitado';
}

const statusConfig = {
  novo_cadastro: { label: 'Novo', variant: 'default' as const },
  aguardando_assinatura: { label: 'Aguardando', variant: 'warning' as const },
  em_analise: { label: 'Em Análise', variant: 'info' as const },
  aprovado: { label: 'Aprovado', variant: 'success' as const },
  rejeitado: { label: 'Rejeitado', variant: 'error' as const },
};

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} size="sm" className={className} {...props}>
      {config.label}
    </Badge>
  );
}

// Signature Badge
export interface SignatureBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: 'pendente' | 'assinado' | 'rejeitado';
}

const signatureConfig = {
  pendente: { label: 'Pendente', variant: 'warning' as const },
  assinado: { label: 'Assinado', variant: 'success' as const },
  rejeitado: { label: 'Rejeitado', variant: 'error' as const },
};

export function SignatureBadge({ status, className, ...props }: SignatureBadgeProps) {
  const config = signatureConfig[status];
  return (
    <Badge variant={config.variant} size="sm" className={className} {...props}>
      {config.label}
    </Badge>
  );
}
