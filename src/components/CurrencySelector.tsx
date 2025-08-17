import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { useCurrency, CURRENCIES, Currency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

export const CurrencySelector = () => {
  const [open, setOpen] = useState(false);
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {selectedCurrency.symbol} {selectedCurrency.code}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {CURRENCIES.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={currency.code}
                  onSelect={() => {
                    setSelectedCurrency(currency);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCurrency.code === currency.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center justify-between w-full">
                    <span>{currency.symbol} {currency.code}</span>
                    <span className="text-muted-foreground text-sm">{currency.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};