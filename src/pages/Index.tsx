import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const PROXY_API = 'https://functions.poehali.dev/989c4cfd-b4f4-4af6-9ef5-c1db70153657';

type Server = {
  id: string;
  name: string;
  country: string;
  load: number;
  ping: number;
  flag: string;
};

type Metrics = {
  download_speed: number;
  upload_speed: number;
  latency: number;
  timestamp: string;
};

const servers: Server[] = [
  { id: '1', name: 'Proxy Server', country: '152.53.253.78', load: 23, ping: 12, flag: '🌐' },
  { id: '2', name: 'США (Восток)', country: 'US', load: 45, ping: 89, flag: '🇺🇸' },
  { id: '3', name: 'Германия #2', country: 'DE', load: 67, ping: 34, flag: '🇩🇪' },
  { id: '4', name: 'Сингапур', country: 'SG', load: 12, ping: 156, flag: '🇸🇬' },
  { id: '5', name: 'Япония #1', country: 'JP', load: 34, ping: 178, flag: '🇯🇵' },
  { id: '6', name: 'Великобритания', country: 'GB', load: 56, ping: 45, flag: '🇬🇧' },
];

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedServer, setSelectedServer] = useState(servers[0]);
  const [activeTab, setActiveTab] = useState('home');
  const [activationKey, setActivationKey] = useState('');
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(true);
  const [metrics, setMetrics] = useState<Metrics>({
    download_speed: 0,
    upload_speed: 0,
    latency: 0,
    timestamp: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isConnected && isKeyValid) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`${PROXY_API}?key=${activationKey}`);
          const data = await response.json();
          
          if (data.metrics) {
            setMetrics(data.metrics);
          }
        } catch (error) {
          console.error('Ошибка получения метрик:', error);
        }
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, isKeyValid, activationKey]);

  const handleValidateKey = async () => {
    try {
      const response = await fetch(PROXY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate_key', key: activationKey })
      });
      
      const data = await response.json();
      
      if (data.valid) {
        setIsKeyValid(true);
        setShowKeyDialog(false);
        toast({
          title: '✅ Ключ активирован',
          description: 'Теперь вы можете подключиться к VPN'
        });
      } else {
        toast({
          title: '❌ Неверный ключ',
          description: 'Проверьте правильность введённого ключа',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '⚠️ Ошибка',
        description: 'Не удалось проверить ключ активации',
        variant: 'destructive'
      });
    }
  };

  const handleConnect = async () => {
    if (!isKeyValid) {
      setShowKeyDialog(true);
      toast({
        title: '🔒 Требуется активация',
        description: 'Введите ключ активации для подключения',
        variant: 'destructive'
      });
      return;
    }

    if (!isConnected) {
      try {
        const response = await fetch(PROXY_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'connect', key: activationKey })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setIsConnected(true);
          toast({
            title: '🚀 Подключено',
            description: `Подключено к Proxy ${data.proxy_ip}`
          });
        } else {
          toast({
            title: '❌ Ошибка подключения',
            description: data.error || 'Не удалось подключиться',
            variant: 'destructive'
          });
        }
      } catch (error) {
        toast({
          title: '⚠️ Ошибка',
          description: 'Не удалось подключиться к серверу',
          variant: 'destructive'
        });
      }
    } else {
      try {
        await fetch(PROXY_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'disconnect', key: activationKey })
        });
        
        setIsConnected(false);
        setMetrics({ download_speed: 0, upload_speed: 0, latency: 0, timestamp: '' });
        toast({
          title: '⏸️ Отключено',
          description: 'Вы отключены от VPN'
        });
      } catch (error) {
        console.error('Ошибка отключения:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] via-[#0F1419] to-[#1A1F2C] text-white">
      <Dialog open={showKeyDialog && !isKeyValid} onOpenChange={setShowKeyDialog}>
        <DialogContent className="glass-effect border-primary/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Icon name="Key" size={24} className="text-primary" />
              Активация VPN
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Введите ключ активации для использования LuksimVPN
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              type="text"
              placeholder="Введите ключ активации"
              value={activationKey}
              onChange={(e) => setActivationKey(e.target.value)}
              className="glass-effect border-primary/30"
              onKeyDown={(e) => e.key === 'Enter' && handleValidateKey()}
            />
            <Button 
              onClick={handleValidateKey} 
              className="w-full bg-gradient-to-r from-primary to-secondary glow-primary"
              disabled={!activationKey}
            >
              Активировать
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary">
                <Icon name="Shield" size={24} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                LuksimVPN
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {isKeyValid && (
                <Badge variant="outline" className="glass-effect border-green-500/30 text-green-400">
                  <Icon name="Check" size={14} className="mr-1" />
                  Активирован
                </Badge>
              )}
              <Badge variant="outline" className="glass-effect border-primary/30 text-primary">
                Premium
              </Badge>
            </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-effect w-full justify-start border-0 p-1">
            <TabsTrigger value="home" className="data-[state=active]:bg-primary/20">
              <Icon name="Home" size={18} className="mr-2" />
              Главная
            </TabsTrigger>
            <TabsTrigger value="servers" className="data-[state=active]:bg-primary/20">
              <Icon name="Server" size={18} className="mr-2" />
              Серверы
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary/20">
              <Icon name="Settings" size={18} className="mr-2" />
              Настройки
            </TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-primary/20">
              <Icon name="MessageCircle" size={18} className="mr-2" />
              Поддержка
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary/20">
              <Icon name="User" size={18} className="mr-2" />
              Профиль
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <Card className="glass-effect border-primary/20 p-8">
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <div
                    className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isConnected
                        ? 'bg-gradient-to-br from-primary to-secondary glow-primary'
                        : 'bg-gradient-to-br from-muted to-muted-foreground/10'
                    }`}
                  >
                    <Icon
                      name={isConnected ? 'ShieldCheck' : 'Shield'}
                      size={80}
                      className="text-white"
                    />
                  </div>
                  {isConnected && (
                    <div className="absolute inset-0 rounded-full border-4 border-primary animate-ping opacity-20"></div>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {isConnected ? 'Защищено' : 'Не подключено'}
                  </h2>
                  <p className="text-muted-foreground">
                    {isConnected ? `Подключено к ${selectedServer.name}` : 'Нажмите для подключения'}
                  </p>
                  {isConnected && (
                    <p className="text-sm text-secondary mt-1">
                      IP: {selectedServer.country}
                    </p>
                  )}
                </div>

                <Button
                  size="lg"
                  onClick={handleConnect}
                  className={`w-full max-w-md text-lg py-6 transition-all duration-300 ${
                    isConnected
                      ? 'bg-destructive hover:bg-destructive/90'
                      : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 glow-primary'
                  }`}
                >
                  {isConnected ? 'Отключиться' : 'Подключиться'}
                </Button>

                {!isKeyValid && (
                  <Button
                    variant="outline"
                    onClick={() => setShowKeyDialog(true)}
                    className="glass-effect border-primary/30"
                  >
                    <Icon name="Key" size={18} className="mr-2" />
                    Ввести ключ активации
                  </Button>
                )}
              </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="glass-effect border-secondary/20 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Скорость загрузки</p>
                    <h3 className="text-3xl font-bold text-secondary">
                      {isConnected ? metrics.download_speed.toFixed(1) : '0'}{' '}
                      <span className="text-lg">Мбит/с</span>
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Icon name="Download" size={24} className="text-secondary" />
                  </div>
                </div>
                <div className="w-full bg-muted/20 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r from-secondary to-secondary/50 transition-all duration-1000 ${
                      isConnected ? 'w-3/4' : 'w-0'
                    }`}
                  ></div>
                </div>
              </Card>

              <Card className="glass-effect border-primary/20 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Скорость отдачи</p>
                    <h3 className="text-3xl font-bold text-primary">
                      {isConnected ? metrics.upload_speed.toFixed(1) : '0'}{' '}
                      <span className="text-lg">Мбит/с</span>
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="Upload" size={24} className="text-primary" />
                  </div>
                </div>
                <div className="w-full bg-muted/20 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r from-primary to-primary/50 transition-all duration-1000 ${
                      isConnected ? 'w-1/2' : 'w-0'
                    }`}
                  ></div>
                </div>
              </Card>

              <Card className="glass-effect border-green-500/20 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Задержка</p>
                    <h3 className="text-3xl font-bold text-green-400">
                      {isConnected ? metrics.latency : '0'} <span className="text-lg">мс</span>
                    </h3>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Icon name="Activity" size={24} className="text-green-400" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-green-500/30 text-green-400">
                    <Icon name="Zap" size={14} className="mr-1" />
                    {isConnected ? 'Отличная связь' : 'Не подключено'}
                  </Badge>
                </div>
              </Card>
            </div>

            <Card className="glass-effect border-primary/20 p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Icon name="Lock" size={20} className="text-primary" />
                Защита и шифрование
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/30 text-primary">
                  <Icon name="Check" size={14} className="mr-1" />
                  AES-256 {isConnected && 'Активно'}
                </Badge>
                <Badge variant="outline" className="border-primary/30 text-primary">
                  <Icon name="Shield" size={14} className="mr-1" />
                  Kill Switch
                </Badge>
                <Badge variant="outline" className="border-secondary/30 text-secondary">
                  <Icon name="Server" size={14} className="mr-1" />
                  Proxy: 152.53.253.78
                </Badge>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="servers" className="space-y-4">
            {servers.map((server) => (
              <Card
                key={server.id}
                className={`glass-effect border-primary/20 p-4 cursor-pointer transition-all duration-200 hover:border-primary/50 ${
                  selectedServer.id === server.id ? 'border-primary glow-primary' : ''
                }`}
                onClick={() => setSelectedServer(server)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{server.flag}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{server.name}</h3>
                      <p className="text-sm text-muted-foreground">{server.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Загрузка</p>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted/20 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-secondary to-primary"
                            style={{ width: `${server.load}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{server.load}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Пинг</p>
                      <p className="font-semibold text-secondary">{server.ping} мс</p>
                    </div>
                    {selectedServer.id === server.id && (
                      <Icon name="Check" size={24} className="text-primary" />
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="glass-effect border-primary/20 p-6">
              <h3 className="text-xl font-bold mb-6">Параметры подключения</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name="Zap" size={20} className="text-primary" />
                    <div>
                      <p className="font-medium">Автоподключение</p>
                      <p className="text-sm text-muted-foreground">
                        Подключаться автоматически при запуске
                      </p>
                    </div>
                  </div>
                  <Switch />
                </div>
                <Separator className="bg-border/50" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name="ShieldAlert" size={20} className="text-primary" />
                    <div>
                      <p className="font-medium">Kill Switch</p>
                      <p className="text-sm text-muted-foreground">
                        Блокировать интернет при разрыве VPN
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-border/50" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name="Globe" size={20} className="text-primary" />
                    <div>
                      <p className="font-medium">Split Tunneling</p>
                      <p className="text-sm text-muted-foreground">
                        Выборочное подключение приложений
                      </p>
                    </div>
                  </div>
                  <Switch />
                </div>
                <Separator className="bg-border/50" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon name="Wifi" size={20} className="text-primary" />
                    <div>
                      <p className="font-medium">Защита в публичных сетях</p>
                      <p className="text-sm text-muted-foreground">
                        Автоматически подключаться в Wi-Fi
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </Card>

            <Card className="glass-effect border-primary/20 p-6">
              <h3 className="text-xl font-bold mb-6">Протоколы</h3>
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start glass-effect border-primary">
                  <Icon name="Check" size={18} className="mr-2 text-primary" />
                  WireGuard (Рекомендуется)
                </Button>
                <Button variant="outline" className="w-full justify-start glass-effect">
                  OpenVPN
                </Button>
                <Button variant="outline" className="w-full justify-start glass-effect">
                  IKEv2
                </Button>
              </div>
            </Card>

            <Card className="glass-effect border-secondary/20 p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Icon name="Key" size={20} className="text-primary" />
                Ключ активации
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Статус активации</p>
                  <p className="font-semibold text-lg">
                    {isKeyValid ? '✅ Активирован' : '❌ Не активирован'}
                  </p>
                </div>
                {!isKeyValid && (
                  <Button
                    onClick={() => setShowKeyDialog(true)}
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    Активировать
                  </Button>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="space-y-4">
            <Card className="glass-effect border-primary/20 p-6">
              <h3 className="text-xl font-bold mb-6">Частые вопросы</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/10 border border-border/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Icon name="HelpCircle" size={18} className="text-primary" />
                    Как начать пользоваться VPN?
                  </h4>
                  <p className="text-sm text-muted-foreground pl-6">
                    Введите ключ активации davidik228, выберите сервер Proxy и нажмите "Подключиться". 
                    Ваше соединение будет автоматически зашифровано через 152.53.253.78.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/10 border border-border/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Icon name="HelpCircle" size={18} className="text-primary" />
                    Что такое мониторинг в реальном времени?
                  </h4>
                  <p className="text-sm text-muted-foreground pl-6">
                    На главном экране отображается скорость загрузки, отдачи и задержка в реальном времени. 
                    Данные обновляются каждые 2 секунды при активном подключении.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/10 border border-border/50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Icon name="HelpCircle" size={18} className="text-primary" />
                    Что делать если забыл ключ активации?
                  </h4>
                  <p className="text-sm text-muted-foreground pl-6">
                    Свяжитесь с службой поддержки для восстановления ключа активации. 
                    Мы работаем 24/7 и поможем вам вернуть доступ.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="glass-effect border-secondary/20 p-6">
              <h3 className="text-xl font-bold mb-4">Нужна помощь?</h3>
              <p className="text-muted-foreground mb-6">
                Наша служба поддержки работает 24/7 и готова помочь вам с любыми вопросами
              </p>
              <div className="grid gap-3">
                <Button variant="outline" className="glass-effect border-secondary">
                  <Icon name="Mail" size={18} className="mr-2" />
                  Написать в поддержку
                </Button>
                <Button variant="outline" className="glass-effect">
                  <Icon name="MessageSquare" size={18} className="mr-2" />
                  Открыть чат
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card className="glass-effect border-primary/20 p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary glow-primary flex items-center justify-center text-3xl font-bold">
                  L
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-1">LuksimUser</h3>
                  <p className="text-muted-foreground">luksim@example.com</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      Premium аккаунт
                    </Badge>
                    {isKeyValid && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <Icon name="Key" size={12} className="mr-1" />
                        Активирован
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Separator className="my-6 bg-border/50" />
              <div className="grid gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Подписка</span>
                  <span className="font-semibold">Premium до 01.03.2026</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Proxy сервер</span>
                  <span className="font-semibold text-secondary">152.53.253.78</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Устройств подключено</span>
                  <span className="font-semibold">1 из 5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Трафик за месяц</span>
                  <span className="font-semibold">
                    {isConnected ? '152.4 ГБ' : '0 ГБ'}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="glass-effect border-primary/20 p-6">
              <h3 className="text-xl font-bold mb-4">Действия с аккаунтом</h3>
              <div className="grid gap-3">
                <Button variant="outline" className="w-full justify-start glass-effect">
                  <Icon name="CreditCard" size={18} className="mr-2" />
                  Управление подпиской
                </Button>
                <Button variant="outline" className="w-full justify-start glass-effect">
                  <Icon name="Key" size={18} className="mr-2" />
                  Изменить пароль
                </Button>
                <Button variant="outline" className="w-full justify-start glass-effect">
                  <Icon name="Smartphone" size={18} className="mr-2" />
                  Управление устройствами
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start glass-effect border-destructive/50 text-destructive"
                >
                  <Icon name="LogOut" size={18} className="mr-2" />
                  Выйти из аккаунта
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
