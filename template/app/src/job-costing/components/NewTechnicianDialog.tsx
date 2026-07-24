import { FormEvent, useState } from "react";
import { createTechnician } from "wasp/client/operations";
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
import { toast } from "../../client/hooks/use-toast";

export function NewTechnicianDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const name = formData.get("name");
    const hourlyCost = formData.get("hourlyCost");

    if (typeof name !== "string" || name.trim() === "") {
      toast({
        title: "Name required",
        description: "Enter the technician's name.",
        variant: "destructive",
      });
      return;
    }
    const hourlyCostValue = Number(hourlyCost);
    if (!Number.isFinite(hourlyCostValue) || hourlyCostValue < 0) {
      toast({
        title: "Invalid hourly cost",
        description: "Enter the technician's fully burdened hourly cost.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createTechnician({ name, hourlyCost: hourlyCostValue });
      toast({
        title: "Technician added",
        description: `${name} can now be assigned labor hours on jobs.`,
      });
      formElement.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Couldn't add technician",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Technician</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Technician</DialogTitle>
          <DialogDescription>
            Enter their fully burdened cost per hour — wage plus payroll tax
            and benefits — not the rate you bill customers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="technician-name">Name</Label>
            <Input id="technician-name" name="name" placeholder="Alex Rivera" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="technician-hourly-cost">Hourly cost ($)</Label>
            <Input
              id="technician-hourly-cost"
              name="hourlyCost"
              type="number"
              min={0}
              step="0.01"
              placeholder="38.50"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Technician"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
