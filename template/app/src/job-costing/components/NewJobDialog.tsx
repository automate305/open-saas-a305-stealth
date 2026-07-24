import { Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { createJob, getTechnicians, useQuery } from "wasp/client/operations";
import { Button } from "../../client/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../client/components/ui/dialog";
import { Input } from "../../client/components/ui/input";
import { Label } from "../../client/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../client/components/ui/select";
import { toast } from "../../client/hooks/use-toast";
import { JobStatus, jobStatusLabels } from "../status";

type LineItemDraft = { description: string; quantity: string; unitCost: string };
type LaborEntryDraft = { technicianId: string; hours: string };

const emptyLineItem: LineItemDraft = {
  description: "",
  quantity: "1",
  unitCost: "",
};
const emptyLaborEntry: LaborEntryDraft = { technicianId: "", hours: "" };

export function NewJobDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<JobStatus>(JobStatus.Completed);
  const [completedAt, setCompletedAt] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([
    { ...emptyLineItem },
  ]);
  const [laborEntries, setLaborEntries] = useState<LaborEntryDraft[]>([
    { ...emptyLaborEntry },
  ]);

  const { data: technicians } = useQuery(getTechnicians);

  function resetForm() {
    setCustomerName("");
    setAddress("");
    setStatus(JobStatus.Completed);
    setCompletedAt("");
    setInvoiceAmount("");
    setLineItems([{ ...emptyLineItem }]);
    setLaborEntries([{ ...emptyLaborEntry }]);
  }

  function updateLineItem(index: number, patch: Partial<LineItemDraft>) {
    setLineItems((items) =>
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function updateLaborEntry(index: number, patch: Partial<LaborEntryDraft>) {
    setLaborEntries((entries) =>
      entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (customerName.trim() === "") {
      toast({
        title: "Customer required",
        description: "Enter who the job was for.",
        variant: "destructive",
      });
      return;
    }

    const invoiceAmountValue = Number(invoiceAmount);
    if (!Number.isFinite(invoiceAmountValue) || invoiceAmountValue < 0) {
      toast({
        title: "Invalid invoice amount",
        description: "Enter what the customer was billed.",
        variant: "destructive",
      });
      return;
    }

    const cleanedLineItems = lineItems
      .filter((item) => item.description.trim() !== "")
      .map((item) => ({
        description: item.description,
        quantity: Number(item.quantity) || 1,
        unitCost: Number(item.unitCost) || 0,
      }));

    const cleanedLaborEntries = laborEntries
      .filter((entry) => entry.technicianId !== "" && Number(entry.hours) > 0)
      .map((entry) => ({
        technicianId: entry.technicianId,
        hours: Number(entry.hours),
      }));

    setIsSubmitting(true);
    try {
      await createJob({
        customerName,
        address: address.trim() === "" ? undefined : address,
        status,
        completedAt: completedAt === "" ? undefined : completedAt,
        invoiceAmount: invoiceAmountValue,
        lineItems: cleanedLineItems,
        laborEntries: cleanedLaborEntries,
      });
      toast({
        title: "Job added",
        description: `${customerName}'s job is now costed.`,
      });
      resetForm();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Couldn't add job",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>Add Job</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Job</DialogTitle>
          <DialogDescription>
            Record what the customer was billed, then the real labor and
            materials cost so we can show true profit, not just revenue.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-customer-name">Customer</Label>
              <Input
                id="job-customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.currentTarget.value)}
                placeholder="Jane Alvarez"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-address">Address (optional)</Label>
              <Input
                id="job-address"
                value={address}
                onChange={(e) => setAddress(e.currentTarget.value)}
                placeholder="123 Ocean Dr"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as JobStatus)}
              >
                <SelectTrigger id="job-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(JobStatus).map((value) => (
                    <SelectItem key={value} value={value}>
                      {jobStatusLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-completed-at">Completed on</Label>
              <Input
                id="job-completed-at"
                type="date"
                value={completedAt}
                onChange={(e) => setCompletedAt(e.currentTarget.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-invoice-amount">Invoice amount ($)</Label>
              <Input
                id="job-invoice-amount"
                type="number"
                min={0}
                step="0.01"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.currentTarget.value)}
                placeholder="850"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Materials & parts</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setLineItems((items) => [...items, { ...emptyLineItem }])
                }
              >
                Add line
              </Button>
            </div>
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 items-center gap-2">
                <Input
                  className="col-span-6"
                  placeholder="Capacitor, 2-ton condenser..."
                  value={item.description}
                  onChange={(e) =>
                    updateLineItem(index, { description: e.currentTarget.value })
                  }
                />
                <Input
                  className="col-span-2"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) =>
                    updateLineItem(index, { quantity: e.currentTarget.value })
                  }
                />
                <Input
                  className="col-span-3"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Unit cost"
                  value={item.unitCost}
                  onChange={(e) =>
                    updateLineItem(index, { unitCost: e.currentTarget.value })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="col-span-1"
                  onClick={() =>
                    setLineItems((items) =>
                      items.filter((_, i) => i !== index),
                    )
                  }
                  disabled={lineItems.length === 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Labor</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setLaborEntries((entries) => [
                    ...entries,
                    { ...emptyLaborEntry },
                  ])
                }
              >
                Add technician
              </Button>
            </div>
            {(!technicians || technicians.length === 0) && (
              <p className="text-muted-foreground text-sm">
                Add a technician above before logging labor hours.
              </p>
            )}
            {technicians &&
              technicians.length > 0 &&
              laborEntries.map((entry, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 items-center gap-2"
                >
                  <div className="col-span-8">
                    <Select
                      value={entry.technicianId}
                      onValueChange={(value) =>
                        updateLaborEntry(index, { technicianId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Technician" />
                      </SelectTrigger>
                      <SelectContent>
                        {technicians.map((technician) => (
                          <SelectItem key={technician.id} value={technician.id}>
                            {technician.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    className="col-span-3"
                    type="number"
                    min={0}
                    step="0.1"
                    placeholder="Hours"
                    value={entry.hours}
                    onChange={(e) =>
                      updateLaborEntry(index, { hours: e.currentTarget.value })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="col-span-1"
                    onClick={() =>
                      setLaborEntries((entries) =>
                        entries.filter((_, i) => i !== index),
                      )
                    }
                    disabled={laborEntries.length === 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
