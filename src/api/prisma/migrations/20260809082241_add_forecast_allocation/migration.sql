BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ForecastAllocation] (
    [id] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2 NOT NULL,
    [vaultId] NVARCHAR(1000) NOT NULL,
    [amount] FLOAT(53) NOT NULL,
    CONSTRAINT [ForecastAllocation_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ForecastAllocation_date_vaultId_key] UNIQUE NONCLUSTERED ([date],[vaultId])
);

-- AddForeignKey
ALTER TABLE [dbo].[ForecastAllocation] ADD CONSTRAINT [ForecastAllocation_vaultId_fkey] FOREIGN KEY ([vaultId]) REFERENCES [dbo].[Vault]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
