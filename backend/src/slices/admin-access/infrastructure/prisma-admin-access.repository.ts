import type {
  AdminAccessAccountRecord,
  AdminAccessAuditRecord,
  AdminAccessAuditAction,
  AdminAccessRepository,
  AdminAccessRole,
  AdminAccessSessionRecord,
  CountRecentFailedLoginInput,
  CreateAdminAccessAuditInput,
  CreateAdminAccessSessionInput,
  RevokeAdminAccessSessionInput,
  RevokeAdminAccessSessionsByAccountInput,
  UpdateAdminAccessSessionInput,
  UpdateAdminLockoutInput,
} from "../domain/admin-access.types";

type AdminAccountFindUniqueArgs = {
  where: {
    login?: string;
    id?: string;
  };
  select: {
    id: true;
    login: true;
    passwordHash: true;
    role: true;
    isActive: true;
    lockedUntil: true;
    createdAt: true;
    updatedAt: true;
  };
};

type AdminAccountUpdateArgs = {
  where: {
    id: string;
  };
  data: {
    lockedUntil: Date;
  };
  select: {
    id: true;
    login: true;
    passwordHash: true;
    role: true;
    isActive: true;
    lockedUntil: true;
    createdAt: true;
    updatedAt: true;
  };
};

type AdminSessionCreateArgs = {
  data: CreateAdminAccessSessionInput;
};

type AdminSessionFindUniqueArgs = {
  where: {
    id?: string;
    refreshTokenHash: string;
  };
  select: {
    id: true;
    adminAccountId: true;
    refreshTokenHash: true;
    accessTokenExpiresAt: true;
    refreshTokenExpiresAt: true;
    idleExpiresAt: true;
    lastActivityAt: true;
    revokedAt: true;
    createdAt: true;
    updatedAt: true;
  };
};

type AdminSessionUpdateArgs = {
  where: {
    id: string;
  };
  data: {
    refreshTokenHash?: string;
    accessTokenExpiresAt?: Date;
    refreshTokenExpiresAt?: Date;
    idleExpiresAt?: Date;
    lastActivityAt?: Date;
    revokedAt?: Date;
  };
  select: {
    id: true;
    adminAccountId: true;
    refreshTokenHash: true;
    accessTokenExpiresAt: true;
    refreshTokenExpiresAt: true;
    idleExpiresAt: true;
    lastActivityAt: true;
    revokedAt: true;
    createdAt: true;
    updatedAt: true;
  };
};

type AdminSessionUpdateManyArgs = {
  where: {
    adminAccountId: string;
    revokedAt: null;
  };
  data: {
    revokedAt: Date;
  };
};

type AdminAuthAuditCreateArgs = {
  data: {
    adminAccountId: string;
    action: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOCKED" | "LOGOUT";
    ipAddress: string | null;
    userAgent: string | null;
    traceId: string;
    reason: string | null;
    createdAt: Date;
  };
};

type AdminAuthAuditCountArgs = {
  where: {
    adminAccountId: string;
    action: "LOGIN_FAILED";
    createdAt: {
      gte: Date;
    };
  };
};

type AdminAccountPrismaRecord = Omit<AdminAccessAccountRecord, "role"> & {
  role: string;
};

type AdminSessionPrismaRecord = AdminAccessSessionRecord;

type AdminAuditPrismaRecord = Omit<AdminAccessAuditRecord, "action"> & {
  action: string;
};

export type AdminAccessPrismaClientLike = {
  adminAccount: {
    findUnique(args: AdminAccountFindUniqueArgs): Promise<AdminAccountPrismaRecord | null>;
    update(args: AdminAccountUpdateArgs): Promise<AdminAccountPrismaRecord>;
  };
  adminSession: {
    create(args: AdminSessionCreateArgs): Promise<AdminSessionPrismaRecord>;
    findUnique(args: AdminSessionFindUniqueArgs): Promise<AdminSessionPrismaRecord | null>;
    update(args: AdminSessionUpdateArgs): Promise<AdminSessionPrismaRecord>;
    updateMany(args: AdminSessionUpdateManyArgs): Promise<{ count: number }>;
  };
  adminAuthAudit: {
    create(args: AdminAuthAuditCreateArgs): Promise<AdminAuditPrismaRecord>;
    count(args: AdminAuthAuditCountArgs): Promise<number>;
  };
};

export type AdminAccessPrismaProvider = {
  readonly client: AdminAccessPrismaClientLike;
};

const mapAdminRole = (role: string): AdminAccessRole => role.toLowerCase() as AdminAccessRole;

const mapAuditAction = (action: string): AdminAccessAuditAction => action.toLowerCase() as AdminAccessAuditAction;

const toAuditAction = (
  action: AdminAccessAuditAction,
): "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOCKED" | "LOGOUT" => action.toUpperCase() as never;

const accountSelect = {
  id: true,
  login: true,
  passwordHash: true,
  role: true,
  isActive: true,
  lockedUntil: true,
  createdAt: true,
  updatedAt: true,
} as const;

const sessionSelect = {
  id: true,
  adminAccountId: true,
  refreshTokenHash: true,
  accessTokenExpiresAt: true,
  refreshTokenExpiresAt: true,
  idleExpiresAt: true,
  lastActivityAt: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class PrismaAdminAccessRepository implements AdminAccessRepository {
  constructor(private readonly prisma: AdminAccessPrismaProvider) {}

  async findAccountByLogin(login: string): Promise<AdminAccessAccountRecord | null> {
    const account = await this.prisma.client.adminAccount.findUnique({
      where: {
        login,
      },
      select: accountSelect,
    });

    if (account === null) {
      return null;
    }

    return {
      ...account,
      role: mapAdminRole(account.role),
    };
  }

  async findAccountById(adminAccountId: string): Promise<AdminAccessAccountRecord | null> {
    const account = await this.prisma.client.adminAccount.findUnique({
      where: {
        id: adminAccountId,
      },
      select: accountSelect,
    });

    if (account === null) {
      return null;
    }

    return {
      ...account,
      role: mapAdminRole(account.role),
    };
  }

  async createSession(input: CreateAdminAccessSessionInput): Promise<AdminAccessSessionRecord> {
    return this.prisma.client.adminSession.create({
      data: input,
    });
  }

  findSessionByRefreshTokenHash(refreshTokenHash: string): Promise<AdminAccessSessionRecord | null> {
    return this.prisma.client.adminSession.findUnique({
      where: {
        refreshTokenHash,
      },
      select: sessionSelect,
    });
  }

  updateSession(input: UpdateAdminAccessSessionInput): Promise<AdminAccessSessionRecord> {
    return this.prisma.client.adminSession.update({
      where: {
        id: input.sessionId,
      },
      data: {
        refreshTokenHash: input.refreshTokenHash,
        accessTokenExpiresAt: input.accessTokenExpiresAt,
        refreshTokenExpiresAt: input.refreshTokenExpiresAt,
        idleExpiresAt: input.idleExpiresAt,
        lastActivityAt: input.lastActivityAt,
      },
      select: sessionSelect,
    });
  }

  revokeSession(input: RevokeAdminAccessSessionInput): Promise<AdminAccessSessionRecord> {
    return this.prisma.client.adminSession.update({
      where: {
        id: input.sessionId,
      },
      data: {
        revokedAt: input.revokedAt,
      },
      select: sessionSelect,
    });
  }

  async revokeSessionsByAccount(input: RevokeAdminAccessSessionsByAccountInput): Promise<number> {
    const result = await this.prisma.client.adminSession.updateMany({
      where: {
        adminAccountId: input.adminAccountId,
        revokedAt: null,
      },
      data: {
        revokedAt: input.revokedAt,
      },
    });

    return result.count;
  }

  async recordAudit(input: CreateAdminAccessAuditInput): Promise<AdminAccessAuditRecord> {
    const audit = await this.prisma.client.adminAuthAudit.create({
      data: {
        adminAccountId: input.adminAccountId,
        action: toAuditAction(input.action),
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        traceId: input.traceId,
        reason: input.reason,
        createdAt: input.createdAt,
      },
    });

    return {
      ...audit,
      action: mapAuditAction(audit.action),
    };
  }

  countFailedLoginAuditsSince(input: CountRecentFailedLoginInput): Promise<number> {
    return this.prisma.client.adminAuthAudit.count({
      where: {
        adminAccountId: input.adminAccountId,
        action: "LOGIN_FAILED",
        createdAt: {
          gte: input.since,
        },
      },
    });
  }

  async setAccountLockout(input: UpdateAdminLockoutInput): Promise<AdminAccessAccountRecord> {
    const account = await this.prisma.client.adminAccount.update({
      where: {
        id: input.adminAccountId,
      },
      data: {
        lockedUntil: input.lockedUntil,
      },
      select: accountSelect,
    });

    return {
      ...account,
      role: mapAdminRole(account.role),
    };
  }
}
