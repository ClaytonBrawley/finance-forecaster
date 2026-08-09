BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Vault] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [currentBalance] FLOAT(53) NOT NULL CONSTRAINT [Vault_currentBalance_df] DEFAULT 0,
    [minGoal] FLOAT(53),
    [maxGoal] FLOAT(53),
    [priority] INT NOT NULL CONSTRAINT [Vault_priority_df] DEFAULT 0,
    [minTransfer] FLOAT(53) NOT NULL CONSTRAINT [Vault_minTransfer_df] DEFAULT 0,
    [emergencyEligible] BIT NOT NULL CONSTRAINT [Vault_emergencyEligible_df] DEFAULT 0,
    [archived] BIT NOT NULL CONSTRAINT [Vault_archived_df] DEFAULT 0,
    [sortOrder] INT NOT NULL CONSTRAINT [Vault_sortOrder_df] DEFAULT 0,
    CONSTRAINT [Vault_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[EarningsPlan] (
    [id] NVARCHAR(1000) NOT NULL,
    [weekday] INT NOT NULL,
    [low] FLOAT(53) NOT NULL,
    [default] FLOAT(53) NOT NULL,
    [high] FLOAT(53) NOT NULL,
    CONSTRAINT [EarningsPlan_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [EarningsPlan_weekday_key] UNIQUE NONCLUSTERED ([weekday])
);

-- CreateTable
CREATE TABLE [dbo].[DailyPlan] (
    [id] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2 NOT NULL,
    [mode] NVARCHAR(1000) NOT NULL CONSTRAINT [DailyPlan_mode_df] DEFAULT 'DEFAULT',
    [customAmount] FLOAT(53),
    CONSTRAINT [DailyPlan_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DailyPlan_date_key] UNIQUE NONCLUSTERED ([date])
);

-- CreateTable
CREATE TABLE [dbo].[ExpenseRule] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [amount] FLOAT(53) NOT NULL,
    [recurrenceType] NVARCHAR(1000) NOT NULL,
    [dayOfMonth] INT,
    [weekday] INT,
    [vaultId] NVARCHAR(1000),
    [active] BIT NOT NULL CONSTRAINT [ExpenseRule_active_df] DEFAULT 1,
    CONSTRAINT [ExpenseRule_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Setting] (
    [id] NVARCHAR(1000) NOT NULL CONSTRAINT [Setting_id_df] DEFAULT 'singleton',
    [remainingCash] FLOAT(53) NOT NULL CONSTRAINT [Setting_remainingCash_df] DEFAULT 0,
    [preferredRemainingCash] FLOAT(53) NOT NULL CONSTRAINT [Setting_preferredRemainingCash_df] DEFAULT 0,
    CONSTRAINT [Setting_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[ExpenseRule] ADD CONSTRAINT [ExpenseRule_vaultId_fkey] FOREIGN KEY ([vaultId]) REFERENCES [dbo].[Vault]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
