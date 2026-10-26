export type DomainIssue = {
  code: string;
  message: string;
  slug?: string;
  field?: string;
};

/** Error de negocio con mensajes seguros para mostrar al cliente. */
export class DomainError extends Error {
  readonly status: number;
  readonly issues: DomainIssue[];

  constructor(message: string, options: { status?: number; issues?: DomainIssue[] } = {}) {
    super(message);
    this.name = "DomainError";
    this.status = options.status ?? 422;
    this.issues = options.issues ?? [];
  }
}
