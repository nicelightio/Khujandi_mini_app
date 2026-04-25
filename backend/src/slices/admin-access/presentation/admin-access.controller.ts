import { AdminAccessService } from "../application/admin-access.service";
import type {
  AdminAccessPasswordHasher,
  AdminAccessTokenFactory,
  AdminAccessTokenHasher,
  CreateAdminSessionBaselineInput,
  LoginAdminAccessInput,
  LockAdminAccountBaselineInput,
  LogoutAdminAccessInput,
  RefreshAdminAccessInput,
  RecordAdminAuditBaselineInput,
  ResolveProtectedAdminSessionInput,
  VerifyAdminCredentialsInput,
} from "../domain/admin-access.types";

export class AdminAccessController {
  constructor(private readonly service: AdminAccessService) {}

  getAccountByLogin(login: string) {
    return this.service.findAccountByLogin(login);
  }

  getRecentFailedLoginCount(adminAccountId: string, now?: Date) {
    return this.service.countRecentFailedLoginAttempts(adminAccountId, now);
  }

  verifyCredentials(input: VerifyAdminCredentialsInput, passwordHasher: AdminAccessPasswordHasher) {
    return this.service.verifyCredentials(input, passwordHasher);
  }

  createSessionBaseline(input: CreateAdminSessionBaselineInput, tokenHasher: AdminAccessTokenHasher) {
    return this.service.createSessionBaseline(input, tokenHasher);
  }

  recordAuditBaseline(input: RecordAdminAuditBaselineInput) {
    return this.service.recordAuditBaseline(input);
  }

  lockAccountBaseline(input: LockAdminAccountBaselineInput) {
    return this.service.lockAccountBaseline(input);
  }

  login(
    input: LoginAdminAccessInput,
    dependencies: {
      passwordHasher: AdminAccessPasswordHasher;
      tokenHasher: AdminAccessTokenHasher;
      tokenFactory: AdminAccessTokenFactory;
    },
  ) {
    return this.service.login(input, dependencies);
  }

  refresh(
    input: RefreshAdminAccessInput,
    dependencies: {
      tokenHasher: AdminAccessTokenHasher;
      tokenFactory: AdminAccessTokenFactory;
    },
  ) {
    return this.service.refresh(input, dependencies);
  }

  logout(
    input: LogoutAdminAccessInput,
    dependencies: {
      tokenHasher: AdminAccessTokenHasher;
    },
  ) {
    return this.service.logout(input, dependencies);
  }

  resolveProtectedSession(
    input: ResolveProtectedAdminSessionInput,
    dependencies: {
      tokenHasher: AdminAccessTokenHasher;
    },
  ) {
    return this.service.resolveProtectedSession(input, dependencies);
  }
}
