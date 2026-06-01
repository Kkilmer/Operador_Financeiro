export const INSTALLMENT_SEQUENCE_OVERFLOW_MESSAGE =
  "Não foi possível ajustar as próximas parcelas porque a sequência ultrapassa o total da compra.";

export const INSTALLMENT_SEQUENCE_CONFLICT_MESSAGE =
  "Não foi possível ajustar as próximas parcelas porque existem parcelas anteriores, pagas ou removidas ocupando a sequência.";

export class InstallmentSequenceOverflowError extends Error {
  requiredTotalInstallments: number;
  currentTotalInstallments: number;

  constructor(requiredTotalInstallments: number, currentTotalInstallments: number) {
    super(INSTALLMENT_SEQUENCE_OVERFLOW_MESSAGE);
    this.name = "InstallmentSequenceOverflowError";
    this.requiredTotalInstallments = requiredTotalInstallments;
    this.currentTotalInstallments = currentTotalInstallments;
  }
}

export type InstallmentSequenceItem = {
  id: string;
  number: number;
  dueDate: Date;
  competenceDate: Date;
  createdAt: Date;
  isSettled: boolean;
  isDeleted: boolean;
};

export type InstallmentSequenceUpdate = {
  id: string;
  number: number;
};

type BuildInstallmentSequenceReorderPlanInput = {
  installments: InstallmentSequenceItem[];
  currentInstallmentId: string;
  requestedNumber: number;
  totalInstallments: number;
};

function compareInstallments(a: InstallmentSequenceItem, b: InstallmentSequenceItem) {
  const dueDateDiff = a.dueDate.getTime() - b.dueDate.getTime();
  if (dueDateDiff !== 0) {
    return dueDateDiff;
  }

  const competenceDiff = a.competenceDate.getTime() - b.competenceDate.getTime();
  if (competenceDiff !== 0) {
    return competenceDiff;
  }

  const createdAtDiff = a.createdAt.getTime() - b.createdAt.getTime();
  if (createdAtDiff !== 0) {
    return createdAtDiff;
  }

  return a.id.localeCompare(b.id);
}

export function buildInstallmentSequenceReorderPlan({
  installments,
  currentInstallmentId,
  requestedNumber,
  totalInstallments,
}: BuildInstallmentSequenceReorderPlanInput) {
  if (requestedNumber < 1 || requestedNumber > totalInstallments) {
    throw new InstallmentSequenceOverflowError(requestedNumber, totalInstallments);
  }

  const orderedInstallments = [...installments].sort(compareInstallments);
  const currentIndex = orderedInstallments.findIndex(
    (installment) => installment.id === currentInstallmentId,
  );

  if (currentIndex === -1) {
    throw new Error("A parcela atual não foi encontrada para ajustar a sequência.");
  }

  const currentInstallment = orderedInstallments[currentIndex];

  if (currentInstallment.number === requestedNumber) {
    return {
      temporaryUpdates: [] as InstallmentSequenceUpdate[],
      finalUpdates: [] as InstallmentSequenceUpdate[],
    };
  }

  const adjustableFutureInstallments = orderedInstallments
    .slice(currentIndex + 1)
    .filter((installment) => !installment.isSettled && !installment.isDeleted);
  const proposedUpdates = [currentInstallment, ...adjustableFutureInstallments].map(
    (installment, index) => ({
      id: installment.id,
      number: requestedNumber + index,
    }),
  );
  const lastProposedNumber = proposedUpdates.at(-1)?.number ?? requestedNumber;

  if (lastProposedNumber > totalInstallments) {
    throw new InstallmentSequenceOverflowError(lastProposedNumber, totalInstallments);
  }

  const updatedIds = new Set(proposedUpdates.map((update) => update.id));
  const proposedNumbers = new Set(proposedUpdates.map((update) => update.number));
  const hasProtectedConflict = orderedInstallments.some(
    (installment) => !updatedIds.has(installment.id) && proposedNumbers.has(installment.number),
  );

  if (hasProtectedConflict) {
    throw new Error(INSTALLMENT_SEQUENCE_CONFLICT_MESSAGE);
  }

  const finalUpdates = proposedUpdates.filter((update) => {
    const original = installments.find((installment) => installment.id === update.id);
    return original?.number !== update.number;
  });

  return {
    temporaryUpdates: finalUpdates.map((update, index) => ({
      id: update.id,
      number: -100000 - index,
    })),
    finalUpdates,
  };
}
