{balance && (
<Card className="w-full shadow-md border border-border/40"> {/* Takes full width, adds subtle border */}
<CardHeader className="pb-4">
{/* You can keep a title or remove it if the layout is self-explanatory */}
<CardTitle className="text-lg font-semibold">Current Balance</CardTitle>
</CardHeader>
<CardContent>
{/* Flex container for horizontal layout, stacks on small screens */}
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-8">

                    {/* Left Section: Date */}
                    <div className="space-y-1 text-left">
                      <p className="text-sm font-medium text-muted-foreground">
                        As of Date
                      </p>
                      <p className="text-base font-semibold">
                        {/* Formatting the date */}
                        {new Date(balance.balanceDate).toLocaleDateString(
                           // Using 'fr-FR' locale based on context, adjust if needed
                           'fr-FR',
                           { year: 'numeric', month: 'long', day: 'numeric' }
                         )}
                      </p>
                    </div>

                    {/* Right Section: Amount */}
                    <div className="space-y-1 text-left sm:text-right w-full sm:w-auto">
                      <p className="text-sm font-medium text-muted-foreground">
                        Available Amount
                      </p>
                      <p className="text-3xl font-bold text-primary">
                        {/* Formatting the currency */}
                        {balance.amount.toLocaleString(
                           // Using 'fr-FR' locale and EUR based on context, adjust if needed
                           'fr-FR',
                           { style: 'currency', currency: balance.currency || 'EUR' } // Default to EUR if currency missing
                         )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
