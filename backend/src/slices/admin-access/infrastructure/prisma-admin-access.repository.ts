import type {
  AdminAccessAccountRecord,
  AdminAccessAuditRecord,
  AdminAccessAuditAction,
  AdminAccessOperatorStaffLifecycleEventRecord,
  AdminAccessOperatorStaffRatingAdjustmentRecord,
  AdminAccessOperatorStaffRecord,
  AdminAccessRepository,
  AdminAccessRole,
  AdminAccessStaffLifecycleAction,
  AdminAccessSessionRecord,
  CountRecentFailedLoginInput,
  CreateAdminAccessAuditInput,
  CreateAdminAccessOperatorStaffInput,
  CreateAdminAccessOperatorStaffRatingAdjustmentInput,
  CreateAdminAccessSessionInput,
  DeactivateAdminAccessOperatorStaffInput,
  RecordAdminAccessOperatorStaffLifecycleEventInput,
  ReactivateAdminAccessOperatorStaffInput,
  RevokeAdminAccessSessionInput,
  RevokeAdminAccessSessionsByAccountInput,
  UpdateAdminAccessSessionInput,
  UpdateAdminAccessOperatorStaffNicknameInput,
  UpdateAdminAccessOperatorStaffPasswordInput,
  UpdateAdminLockoutInput,
} from "../domain/admin-access.types";

type AdminAccountFindUniqueArgs = {
  where: {
    login?: string;
    id?: string;
  };
  select: Record<string, true>;
};

type AdminAccountFindManyArgs = {
  where: {
    role: "OPERATOR";
  };
  select: Record<string, true>;
};

type AdminAccountCreateOperatorStaffArgs = {
  data: {
    login: string;
    passwordHash: string;
    role: "OPERATOR";
    nickname: string;
    isActive: true;
    lockedUntil: null;
    staffCreatedAt: Date;
    staffCreatedByAdminAccountId: string;
    staffDeactivatedAt: null;
    staffDeactivatedByAdminAccountId: null;
    staffReactivatedAt: null;
    staffReactivatedByAdminAccountId: null;
  };
  select: Record<string, true>;
};

type AdminAccountUpdateArgs = {
  where: {
    id: string;
  };
  data: {
    isActive?: boolean;
    lockedUntil?: Date;
    passwordHash?: string;
    nickname?: string;
    staffDeactivatedAt?: Date | null;
    staffDeactivatedByAdminAccountId?: string | null;
    staffReactivatedAt?: Date | null;
    staffReactivatedByAdminAccountId?: string | null;
  };
  select: Record<string, true>;
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
    accessTokenHash: true;
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
    accessTokenHash?: string;
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
    accessTokenHash: true;
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

type OperatorStaffLifecycleEventCreateArgs = {
  data: {
    operatorAdminAccountId: string;
    actorAdminAccountId: string;
    action: "CREATED" | "DEACTIVATED" | "REACTIVATED" | "NICKNAME_UPDATED";
    previousNickname: string | null;
    newNickname: string | null;
    reason: string | null;
    createdAt: Date;
  };
};

type OperatorStaffLifecycleEventFindManyArgs = {
  where: {
    operatorAdminAccountId: {
      in: string[];
    };
  };
  select?: Record<string, true>;
  orderBy?: {
    createdAt: "desc";
  };
};

type OperatorStaffRatingAdjustmentCreateArgs = {
  data: {
    operatorAdminAccountId: string;
    actorAdminAccountId: string;
    delta: -1 | 1;
    reason: string | null;
    createdAt: Date;
  };
};

type OperatorStaffRatingAdjustmentFindManyArgs = {
  where: {
    operatorAdminAccountId: {
      in: string[];
    };
  };
  select?: Record<string, true>;
};

type AdminAccountPrismaRecord = Omit<AdminAccessAccountRecord, "role"> & {
  role: string;
};

type AdminOperatorStaffPrismaRecord = {
  id: string;
  login: string;
  role: string;
  nickname: string | null;
  isActive: boolean;
  lockedUntil: Date | null;
  staffCreatedAt: Date | null;
  staffCreatedByAdminAccountId: string | null;
  staffDeactivatedAt: Date | null;
  staffDeactivatedByAdminAccountId: string | null;
  staffReactivatedAt: Date | null;
  staffReactivatedByAdminAccountId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type AdminSessionPrismaRecord = AdminAccessSessionRecord;

type AdminAuditPrismaRecord = Omit<AdminAccessAuditRecord, "action"> & {
  action: string;
};

type OperatorStaffLifecycleEventPrismaRecord = Omit<
  AdminAccessOperatorStaffLifecycleEventRecord,
  "action"
> & {
  action: string;
};

type OperatorStaffRatingAdjustmentPrismaRecord = AdminAccessOperatorStaffRatingAdjustmentRecord;

export type AdminAccessPrismaClientLike = {
  adminAccount: {
    findUnique(args: AdminAccountFindUniqueArgs): Promise<AdminAccountPrismaRecord | AdminOperatorStaffPrismaRecord | null>;
    findMany?(args: AdminAccountFindManyArgs): Promise<AdminOperatorStaffPrismaRecord[]>;
    create?(args: AdminAccountCreateOperatorStaffArgs): Promise<AdminOperatorStaffPrismaRecord>;
    update(args: AdminAccountUpdateArgs): Promise<AdminAccountPrismaRecord | AdminOperatorStaffPrismaRecord>;
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
  operatorStaffLifecycleEvent?: {
    create(args: OperatorStaffLifecycleEventCreateArgs): Promise<OperatorStaffLifecycleEventPrismaRecord>;
    findMany?(args: OperatorStaffLifecycleEventFindManyArgs): Promise<OperatorStaffLifecycleEventPrismaRecord[]>;
  };
  operatorStaffRatingAdjustment?: {
    create(args: OperatorStaffRatingAdjustmentCreateArgs): Promise<OperatorStaffRatingAdjustmentPrismaRecord>;
    findMany?(args: OperatorStaffRatingAdjustmentFindManyArgs): Promise<OperatorStaffRatingAdjustmentPrismaRecord[]>;
  };
};

export type AdminAccessPrismaProvider = {
  readonly client: AdminAccessPrismaClientLike;
};

const mapAdminRole = (role: string): AdminAccessRole => role.toLowerCase() as AdminAccessRole;

const mapAuditAction = (action: string): AdminAccessAuditAction => action.toLowerCase() as AdminAccessAuditAction;

const mapStaffLifecycleAction = (action: string): AdminAccessStaffLifecycleAction =>
  action.toLowerCase() as AdminAccessStaffLifecycleAction;

const toAuditAction = (
  action: AdminAccessAuditAction,
): "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOCKED" | "LOGOUT" => action.toUpperCase() as never;

const toStaffLifecycleAction = (
  action: AdminAccessStaffLifecycleAction,
): "CREATED" | "DEACTIVATED" | "REACTIVATED" | "NICKNAME_UPDATED" => action.toUpperCase() as never;

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
  accessTokenHash: true,
  refreshTokenHash: true,
  accessTokenExpiresAt: true,
  refreshTokenExpiresAt: true,
  idleExpiresAt: true,
  lastActivityAt: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const operatorStaffSelect = {
  id: true,
  login: true,
  role: true,
  nickname: true,
  isActive: true,
  lockedUntil: true,
  staffCreatedAt: true,
  staffCreatedByAdminAccountId: true,
  staffDeactivatedAt: true,
  staffDeactivatedByAdminAccountId: true,
  staffReactivatedAt: true,
  staffReactivatedByAdminAccountId: true,
  createdAt: true,
  updatedAt: true,
} as const;

const toOperatorStaffRecord = (
  account: AdminOperatorStaffPrismaRecord,
): AdminAccessOperatorStaffRecord | null => {
  if (mapAdminRole(account.role) !== "operator") {
    return null;
  }

  return {
    id: account.id,
    login: account.login,
    nickname: account.nickname,
    role: "operator",
    authActive: account.isActive,
    lockedUntil: account.lockedUntil,
    lifecycle: {
      staffCreatedAt: account.staffCreatedAt,
      staffCreatedByAdminAccountId: account.staffCreatedByAdminAccountId,
      staffDeactivatedAt: account.staffDeactivatedAt,
      staffDeactivatedByAdminAccountId: account.staffDeactivatedByAdminAccountId,
      staffReactivatedAt: account.staffReactivatedAt,
      staffReactivatedByAdminAccountId: account.staffReactivatedByAdminAccountId,
    },
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
};

export class PrismaAdminAccessRepository implements AdminAccessRepository {
  constructor(private readonly prisma: AdminAccessPrismaProvider) {}

  async findAccountByLogin(login: string): Promise<AdminAccessAccountRecord | null> {
    const account = (await this.prisma.client.adminAccount.findUnique({
      where: {
        login,
      },
      select: accountSelect,
    })) as AdminAccountPrismaRecord | null;

    if (account === null) {
      return null;
    }

    return {
      ...account,
      role: mapAdminRole(account.role),
    };
  }

  async findAccountById(adminAccountId: string): Promise<AdminAccessAccountRecord | null> {
    const account = (await this.prisma.client.adminAccount.findUnique({
      where: {
        id: adminAccountId,
      },
      select: accountSelect,
    })) as AdminAccountPrismaRecord | null;

    if (account === null) {
      return null;
    }

    return {
      ...account,
      role: mapAdminRole(account.role),
    };
  }

  async findOperatorStaffById(adminAccountId: string): Promise<AdminAccessOperatorStaffRecord | null> {
    const account = (await this.prisma.client.adminAccount.findUnique({
      where: {
        id: adminAccountId,
      },
      select: operatorStaffSelect,
    })) as AdminOperatorStaffPrismaRecord | null;

    if (account === null) {
      return null;
    }

    return toOperatorStaffRecord(account);
  }

  async createOperatorStaff(
    input: CreateAdminAccessOperatorStaffInput,
  ): Promise<AdminAccessOperatorStaffRecord> {
    if (this.prisma.client.adminAccount.create === undefined) {
      throw new Error("Prisma admin access client does not support operator staff creation.");
    }

    const account = await this.prisma.client.adminAccount.create({
      data: {
        login: input.login,
        passwordHash: input.passwordHash,
        role: "OPERATOR",
        nickname: input.nickname,
        isActive: true,
        lockedUntil: null,
        staffCreatedAt: input.createdAt,
        staffCreatedByAdminAccountId: input.actorAdminAccountId,
        staffDeactivatedAt: null,
        staffDeactivatedByAdminAccountId: null,
        staffReactivatedAt: null,
        staffReactivatedByAdminAccountId: null,
      },
      select: operatorStaffSelect,
    });
    const operator = toOperatorStaffRecord(account);

    if (operator === null) {
      throw new Error("Created admin account is not an operator staff account.");
    }

    return operator;
  }

  async deactivateOperatorStaff(
    input: DeactivateAdminAccessOperatorStaffInput,
  ): Promise<AdminAccessOperatorStaffRecord> {
    const account = (await this.prisma.client.adminAccount.update({
      where: {
        id: input.operatorAdminAccountId,
      },
      data: {
        isActive: false,
        staffDeactivatedAt: input.deactivatedAt,
        staffDeactivatedByAdminAccountId: input.actorAdminAccountId,
      },
      select: operatorStaffSelect,
    })) as AdminOperatorStaffPrismaRecord;
    const operator = toOperatorStaffRecord(account);

    if (operator === null) {
      throw new Error("Updated admin account is not an operator staff account.");
    }

    return operator;
  }

  async reactivateOperatorStaff(
    input: ReactivateAdminAccessOperatorStaffInput,
  ): Promise<AdminAccessOperatorStaffRecord> {
    const account = (await this.prisma.client.adminAccount.update({
      where: {
        id: input.operatorAdminAccountId,
      },
      data: {
        isActive: true,
        staffDeactivatedAt: null,
        staffDeactivatedByAdminAccountId: null,
        staffReactivatedAt: input.reactivatedAt,
        staffReactivatedByAdminAccountId: input.actorAdminAccountId,
      },
      select: operatorStaffSelect,
    })) as AdminOperatorStaffPrismaRecord;
    const operator = toOperatorStaffRecord(account);

    if (operator === null) {
      throw new Error("Updated admin account is not an operator staff account.");
    }

    return operator;
  }

  async updateOperatorStaffPassword(
    input: UpdateAdminAccessOperatorStaffPasswordInput,
  ): Promise<AdminAccessOperatorStaffRecord> {
    const account = (await this.prisma.client.adminAccount.update({
      where: {
        id: input.operatorAdminAccountId,
      },
      data: {
        passwordHash: input.passwordHash,
      },
      select: operatorStaffSelect,
    })) as AdminOperatorStaffPrismaRecord;
    const operator = toOperatorStaffRecord(account);

    if (operator === null) {
      throw new Error("Updated admin account is not an operator staff account.");
    }

    return operator;
  }

  async updateOperatorStaffNickname(
    input: UpdateAdminAccessOperatorStaffNicknameInput,
  ): Promise<AdminAccessOperatorStaffRecord> {
    const account = (await this.prisma.client.adminAccount.update({
      where: {
        id: input.operatorAdminAccountId,
      },
      data: {
        nickname: input.nickname,
      },
      select: operatorStaffSelect,
    })) as AdminOperatorStaffPrismaRecord;
    const operator = toOperatorStaffRecord(account);

    if (operator === null) {
      throw new Error("Updated admin account is not an operator staff account.");
    }

    return operator;
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
        accessTokenHash: input.accessTokenHash,
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

  async recordOperatorStaffLifecycleEvent(
    input: RecordAdminAccessOperatorStaffLifecycleEventInput,
  ): Promise<AdminAccessOperatorStaffLifecycleEventRecord> {
    if (this.prisma.client.operatorStaffLifecycleEvent?.create === undefined) {
      throw new Error("Prisma admin access client does not support operator staff lifecycle events.");
    }

    const event = await this.prisma.client.operatorStaffLifecycleEvent.create({
      data: {
        operatorAdminAccountId: input.operatorAdminAccountId,
        actorAdminAccountId: input.actorAdminAccountId,
        action: toStaffLifecycleAction(input.action),
        previousNickname: input.previousNickname ?? null,
        newNickname: input.newNickname ?? null,
        reason: input.reason ?? null,
        createdAt: input.createdAt,
      },
    });

    return {
      ...event,
      action: mapStaffLifecycleAction(event.action),
    };
  }

  async recordOperatorStaffRatingAdjustment(
    input: CreateAdminAccessOperatorStaffRatingAdjustmentInput,
  ): Promise<AdminAccessOperatorStaffRatingAdjustmentRecord> {
    if (this.prisma.client.operatorStaffRatingAdjustment?.create === undefined) {
      throw new Error("Prisma admin access client does not support operator staff rating adjustments.");
    }

    return this.prisma.client.operatorStaffRatingAdjustment.create({
      data: {
        operatorAdminAccountId: input.operatorAdminAccountId,
        actorAdminAccountId: input.actorAdminAccountId,
        delta: input.delta,
        reason: input.reason ?? null,
        createdAt: input.createdAt,
      },
    });
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
    const account = (await this.prisma.client.adminAccount.update({
      where: {
        id: input.adminAccountId,
      },
      data: {
        lockedUntil: input.lockedUntil,
      },
      select: accountSelect,
    })) as AdminAccountPrismaRecord;

    return {
      ...account,
      role: mapAdminRole(account.role),
    };
  }
}
