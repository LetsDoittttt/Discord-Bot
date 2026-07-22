import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGetConfig, getGetConfigQueryKey, useUpdateConfig } from '@workspace/api-client-react';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

const configSchema = z.object({
  sourceChannel: z.string().min(1, "Source channel is required").startsWith("@", "Channel must start with @"),
  admavenEnabled: z.boolean(),
});

type ConfigFormValues = z.infer<typeof configSchema>;

export default function Config() {
  const queryClient = useQueryClient();
  
  const { data: config, isLoading } = useGetConfig({
    query: {
      queryKey: getGetConfigQueryKey(),
    }
  });

  const updateConfig = useUpdateConfig();

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      sourceChannel: '',
      admavenEnabled: false,
    },
  });

  const initialized = useRef(false);
  useEffect(() => {
    if (config && !initialized.current) {
      form.reset({
        sourceChannel: config.sourceChannel,
        admavenEnabled: config.admavenEnabled,
      });
      initialized.current = true;
    }
  }, [config, form]);

  const onSubmit = (data: ConfigFormValues) => {
    updateConfig.mutate({ data }, {
      onSuccess: () => {
        toast.success("SYS_CONFIG_UPDATED", {
          description: "The bot will use these settings for the next execution.",
        });
        queryClient.invalidateQueries({ queryKey: getGetConfigQueryKey() });
      },
      onError: (error: any) => {
        toast.error("UPDATE_FAILED", {
          description: error.message || "An unexpected error occurred.",
        });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Settings className="text-primary" /> Bot Configuration
        </h1>
        <p className="text-muted-foreground">Adjust operating parameters for the Telegram auto-poster.</p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border shadow-xl shadow-black/20">
        <CardHeader className="border-b border-border bg-card/30">
          <CardTitle className="font-mono text-lg flex items-center gap-2">
            <span className="text-primary">/</span> PARAMETERS
          </CardTitle>
          <CardDescription>Changes apply immediately to the next processing cycle.</CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-8 pt-6">
              <FormField
                control={form.control}
                name="sourceChannel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Telegram Source Channel</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="@channel_name" 
                        {...field} 
                        className="font-mono bg-background/50 border-input max-w-md text-primary focus-visible:ring-primary/50"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      The public Telegram channel username to monitor for new links.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-muted/10 border border-border rounded-lg p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/50" />
                <FormField
                  control={form.control}
                  name="admavenEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg shadow-sm">
                      <div className="space-y-1.5 pr-8">
                        <FormLabel className="text-base font-medium flex items-center gap-2">
                          AdMaven Bypass
                          {field.value && <Badge variant="success" className="ml-2 py-0 h-5 px-1.5 text-[10px] font-mono tracking-widest">ACTIVE</Badge>}
                        </FormLabel>
                        <FormDescription className="text-sm">
                          Automatically attempt to bypass AdMaven and similar link shorteners before posting to Discord.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-md bg-accent/30 border border-border text-sm">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Note:</strong> Bot must be restarted manually if the source channel requires authentication changes or if it was previously rate-limited.
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="bg-card border-t border-border px-6 py-4 flex justify-between items-center">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                {config?.updatedAt ? `LAST_SYNC: ${new Date(config.updatedAt).toLocaleString()}` : ''}
              </p>
              <Button 
                type="submit" 
                disabled={isLoading || updateConfig.isPending}
                className="min-w-[140px] font-mono font-bold tracking-wider"
              >
                {updateConfig.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    SAVING_
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" /> SAVE_CFG
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
