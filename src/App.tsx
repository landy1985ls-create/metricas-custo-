/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  X, 
  TrendingUp, 
  Info, 
  Cpu, 
  RotateCcw, 
  Sparkles, 
  Layers,
  Sliders,
  AlertTriangle,
  HelpCircle,
  Truck,
  Box,
  Percent,
  CheckCircle,
  Store,
  Home,
  ChevronRight,
  RefreshCw,
  TrendingDown
} from 'lucide-react';

export interface Item {
  id: string;
  name: string;
  category: string;
  cost: number;              // Preço pago ao fornecedor (Custo de Aquisição)
  salePrice: number;         // Preço de venda ao público
  quantity: number;          // Quantidade de unidades adquiridas
  channel: 'ml_classico' | 'ml_premium' | 'shopee' | 'shopee_frete' | 'direto';
  packagingCost: number;     // Embalagem (envelope, caixa, fita, plástico bolha)
  unitTransportCost: number; // Gasolina/passagem proporcional dividida por item para ir buscar
}

// Initial mockup values with detailed expenses matching the user's workflow.
const INITIAL_ITEMS: Item[] = [
  {
    id: '1',
    name: 'Fone Bluetooth Pro G2',
    category: 'Acessórios Tech',
    cost: 45.00,
    salePrice: 120.00,
    quantity: 2,
    channel: 'ml_classico',
    packagingCost: 3.50,
    unitTransportCost: 2.50,
  },
  {
    id: '2',
    name: 'Mouse Pad Ergonômico',
    category: 'Home Office',
    cost: 18.50,
    salePrice: 49.90,
    quantity: 5,
    channel: 'shopee',
    packagingCost: 2.00,
    unitTransportCost: 1.50,
  },
  {
    id: '3',
    name: 'Webcam 1080p Streamer',
    category: 'Acessórios Tech',
    cost: 85.00,
    salePrice: 189.00,
    quantity: 2,
    channel: 'ml_premium',
    packagingCost: 4.50,
    unitTransportCost: 3.00,
  },
  {
    id: '4',
    name: 'Hub USB-C Premium',
    category: 'Acessórios Tech',
    cost: 60.00,
    salePrice: 135.00,
    quantity: 1,
    channel: 'shopee_frete',
    packagingCost: 3.00,
    unitTransportCost: 2.00,
  }
];

const RECOMMENDED_CATEGORIES = [
  {
    name: 'Acessórios Tech',
    desc: 'Celular e periféricos. Giro rápido, alta demanda no ML e Shopee.'
  },
  {
    name: 'Beleza & Skincare',
    desc: 'Sérums e Cremes. Embalagens compactas, leve para transporte.'
  },
  {
    name: 'Home Office',
    desc: 'Suportes e mouses ergonômicos. Bom ticket médio e embalagens simples.'
  }
];

// Helper calculation function
export function calculateItemFinancials(item: Item) {
  const cost = Number(item.cost) || 0;
  const sale = Number(item.salePrice) || 0;
  const pack = Number(item.packagingCost) || 0;
  const transp = Number(item.unitTransportCost) || 0;
  
  let feePct = 0;
  let flatFee = 0;
  let label = '';
  let channelGroup: 'ml' | 'shopee' | 'direto' = 'direto';
  
  switch (item.channel) {
    case 'ml_classico':
      feePct = 0.12; // 12% comissão Mercado Livre Clássico
      label = 'Mercado Livre Clássico';
      channelGroup = 'ml';
      if (sale < 79) flatFee = 6.00; // Taxa fixa p/ itens menores de R$ 79
      break;
    case 'ml_premium':
      feePct = 0.17; // 17% comissão Mercado Livre Premium (sem juros)
      label = 'Mercado Livre Premium';
      channelGroup = 'ml';
      if (sale < 79) flatFee = 6.00; // Taxa fixa p/ itens menores de R$ 79
      break;
    case 'shopee':
      feePct = 0.14; // 14% comissão padrão Shopee
      label = 'Shopee Padrão';
      channelGroup = 'shopee';
      flatFee = 3.00; // Taxa de transação fixa Shopee por item vendido
      break;
    case 'shopee_frete':
      feePct = 0.20; // 14% padrão + 6% Programa Frete Grátis Shopee
      label = 'Shopee Frete Grátis';
      channelGroup = 'shopee';
      flatFee = 3.00; // Taxa de transação fixa Shopee por item vendido
      break;
    case 'direto':
    default:
      feePct = 0;
      label = 'Venda Direta / Offline';
      channelGroup = 'direto';
      flatFee = 0;
      break;
  }
  
  const platformFee = (sale * feePct) + flatFee;
  // Investimento direto na unidade (Custo Produto + Embalagem + Passagem/Combustível unitário)
  const spentCapital = cost + pack + transp; 
  const totalCost = spentCapital + platformFee;
  const netProfit = sale - totalCost;
  
  // Margem de Contribuição Líquia (%)
  const marginPercentage = sale > 0 ? (netProfit / sale) * 100 : 0;
  
  // ROI Real do Capital Empatado (%)
  const roiPercentage = spentCapital > 0 ? (netProfit / spentCapital) * 100 : 0;
  
  return {
    feePct,
    flatFee,
    platformFee,
    spentCapital,
    totalCost,
    netProfit,
    marginPercentage,
    roiPercentage,
    label,
    channelGroup
  };
}

export default function App() {
  // State from LocalStorage with fallback templates
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('marginmaster_items_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Falha ao ler itens', e);
      }
    }
    return INITIAL_ITEMS;
  });

  const [totalPlanned, setTotalPlanned] = useState<number>(() => {
    const saved = localStorage.getItem('marginmaster_planned_investment');
    return saved ? Number(saved) : 1000.00;
  });

  // Trip expenses (Sourcing traveling runs to suppliers)
  const [tripExpense, setTripExpense] = useState<number>(() => {
    const saved = localStorage.getItem('marginmaster_trip_expense');
    return saved ? Number(saved) : 50.00; // R$ 50,00 average cost per trip (gasoline + toll/parking)
  });

  const [tripsCount, setTripsCount] = useState<number>(() => {
    const saved = localStorage.getItem('marginmaster_trips_count');
    return saved ? Number(saved) : 2; // Default 2 trips made to physical suppliers
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Active platform channels filter
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string | null>(null);

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Modal / Form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Acessórios Tech');
  const [formCost, setFormCost] = useState<string>('');
  const [formSalePrice, setFormSalePrice] = useState<string>('');
  const [formQuantity, setFormQuantity] = useState<string>('1');
  const [formChannel, setFormChannel] = useState<'ml_classico' | 'ml_premium' | 'shopee' | 'shopee_frete' | 'direto'>('ml_classico');
  const [formPackagingCost, setFormPackagingCost] = useState<string>('3.00'); // Default packaging average
  const [formUnitTransportCost, setFormUnitTransportCost] = useState<string>('2.00'); // Default unit fuel share

  // Inline budget modification
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState<string>('');

  // Persists
  useEffect(() => {
    localStorage.setItem('marginmaster_items_v2', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('marginmaster_planned_investment', totalPlanned.toString());
  }, [totalPlanned]);

  useEffect(() => {
    localStorage.setItem('marginmaster_trip_expense', tripExpense.toString());
  }, [tripExpense]);

  useEffect(() => {
    localStorage.setItem('marginmaster_trips_count', tripsCount.toString());
  }, [tripsCount]);

  // Overall Financial stats including detailed logs
  const totals = useMemo(() => {
    let originalStockCost = 0;       // Core product cost only
    let totalPackagingOverall = 0;   // Embalagens geral
    let totalItemTransportOverhead = 0; // Custos proporcionais diretos
    let totalPlatformFees = 0;       // Comissões ML / Shopee retidas
    let totalPotentialRevenue = 0;   // Gaturamento Bruto Estimado
    let expectedOperatingProfit = 0; // Lucro bruto das vendas

    items.forEach(item => {
      const financials = calculateItemFinancials(item);
      originalStockCost += item.cost * item.quantity;
      totalPackagingOverall += (item.packagingCost || 0) * item.quantity;
      totalItemTransportOverhead += (item.unitTransportCost || 0) * item.quantity;
      totalPotentialRevenue += item.salePrice * item.quantity;
      expectedOperatingProfit += financials.netProfit * item.quantity;
      totalPlatformFees += financials.platformFee * item.quantity;
    });

    // Sourcing trips aggregate overhead
    const logisticsOverheadTravel = tripExpense * tripsCount;
    
    // Real Adjust Net Profit = Profit of products – logistics traveling spend (sourcing runs)
    const realNetProfit = expectedOperatingProfit - logisticsOverheadTravel;

    // Direct Invested out of pocket capital = Stock items supplier cost + individual packing + physical unit pickup cost
    const investedOutofPocket = originalStockCost + totalPackagingOverall + totalItemTransportOverhead;
    
    // Total Real ROI on working capital
    const realProjectedRoiPercentage = investedOutofPocket > 0 
      ? (realNetProfit / investedOutofPocket) * 100 
      : 0;

    return {
      originalStockCost,
      totalPackagingOverall,
      totalItemTransportOverhead,
      totalPlatformFees,
      totalPotentialRevenue,
      expectedOperatingProfit,
      logisticsOverheadTravel,
      realNetProfit,
      investedOutofPocket,
      realProjectedRoiPercentage
    };
  }, [items, tripExpense, tripsCount]);

  // Actions
  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory(selectedCategory || 'Acessórios Tech');
    setFormCost('');
    setFormSalePrice('');
    setFormQuantity('1');
    setFormChannel('ml_classico');
    setFormPackagingCost('3.00');
    setFormUnitTransportCost('2.00');
    setIsModalOpen(true);
  };

  const openEditModal = (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormCost(item.cost.toString());
    setFormSalePrice(item.salePrice.toString());
    setFormQuantity(item.quantity.toString());
    setFormChannel(item.channel || 'ml_classico');
    setFormPackagingCost((item.packagingCost ?? 3.00).toString());
    setFormUnitTransportCost((item.unitTransportCost ?? 2.00).toString());
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const costValue = Math.max(0, parseFloat(formCost) || 0);
    const saleValue = Math.max(0, parseFloat(formSalePrice) || 0);
    const quantityValue = Math.max(1, parseInt(formQuantity) || 1);
    const packagingValue = Math.max(0, parseFloat(formPackagingCost) || 0);
    const transportValue = Math.max(0, parseFloat(formUnitTransportCost) || 0);

    if (editingItem) {
      setItems(prev => prev.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            name: formName.trim(),
            category: formCategory,
            cost: costValue,
            salePrice: saleValue,
            quantity: quantityValue,
            channel: formChannel,
            packagingCost: packagingValue,
            unitTransportCost: transportValue
          };
        }
        return item;
      }));
    } else {
      const newItem: Item = {
        id: Date.now().toString(),
        name: formName.trim(),
        category: formCategory,
        cost: costValue,
        salePrice: saleValue,
        quantity: quantityValue,
        channel: formChannel,
        packagingCost: packagingValue,
        unitTransportCost: transportValue
      };
      setItems(prev => [...prev, newItem]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza de que deseja remover este produto e apagar todos os cálculos dele?')) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleResetData = () => {
    if (confirm('Deseja redefinir para os dados demonstrativos padrão do MarginMaster Pro?')) {
      setItems(INITIAL_ITEMS);
      setTotalPlanned(1000.00);
      setTripExpense(50.00);
      setTripsCount(2);
      setSelectedCategory(null);
      setSelectedChannelFilter(null);
      setSearchQuery('');
    }
  };

  const handleUpdateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(tempBudget);
    if (!isNaN(parsed) && parsed >= 0) {
      setTotalPlanned(parsed);
    }
    setIsEditingBudget(false);
  };

  // Modal active calculation preview helper
  const modalLiveCalculations = useMemo(() => {
    const cost = parseFloat(formCost) || 0;
    const sale = parseFloat(formSalePrice) || 0;
    const pack = parseFloat(formPackagingCost) || 0;
    const transp = parseFloat(formUnitTransportCost) || 0;

    const dummyItem: Item = {
      id: 'temp',
      name: 'Temp',
      category: 'Temp',
      cost,
      salePrice: sale,
      quantity: 1,
      channel: formChannel,
      packagingCost: pack,
      unitTransportCost: transp
    };

    return calculateItemFinancials(dummyItem);
  }, [formCost, formSalePrice, formChannel, formPackagingCost, formUnitTransportCost]);

  // List processing (filters applied)
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      
      let matchesChannel = true;
      if (selectedChannelFilter) {
        if (selectedChannelFilter === 'ml') {
          matchesChannel = item.channel === 'ml_classico' || item.channel === 'ml_premium';
        } else if (selectedChannelFilter === 'shopee') {
          matchesChannel = item.channel === 'shopee' || item.channel === 'shopee_frete';
        } else if (selectedChannelFilter === 'direto') {
          matchesChannel = item.channel === 'direto';
        }
      }

      return matchesSearch && matchesCategory && matchesChannel;
    });
  }, [items, searchQuery, selectedCategory, selectedChannelFilter]);

  return (
    <div className="h-screen w-full overflow-hidden bg-slate-50 flex flex-col font-sans select-none antialiased">
      
      {/* Header Section */}
      <header className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-indigo-500 shrink-0 shadow-md">
        <div className="mb-3 sm:mb-0">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-indigo-600 rounded text-xs font-black font-mono tracking-wider text-white shadow-sm">MMP</span>
            <h1 className="text-xl font-bold tracking-tight">
              MarginMaster Pro <span className="text-indigo-400 font-light text-base hidden md:inline">| ROI, Mercado Livre & Shopee Sourcing</span>
            </h1>
          </div>
          <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-widest flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Simulador de Custos - Logística Residencial e Viagens de Retirada
          </p>
        </div>
        
        {/* Header KPI Actions */}
        <div className="flex gap-6 items-center w-full sm:w-auto justify-between sm:justify-start">
          
          {/* Budget / Out-of-pocket plan widget */}
          <div className="text-right border-r border-slate-700 pr-6 relative group">
            <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">
              Capital Inicial Disponível
            </p>
            {isEditingBudget ? (
              <form onSubmit={handleUpdateBudget} className="flex items-center gap-1 mt-0.5 justify-end">
                <span className="text-emerald-400 font-mono text-sm">R$</span>
                <input 
                  type="number"
                  step="50"
                  className="bg-slate-800 text-white font-mono text-sm w-24 px-1 py-0.5 border border-slate-600 rounded focus:border-emerald-400 focus:outline-none"
                  value={tempBudget}
                  autoFocus
                  onChange={(e) => setTempBudget(e.target.value)}
                  onBlur={() => setIsEditingBudget(false)}
                />
              </form>
            ) : (
              <div 
                onClick={() => {
                  setTempBudget(totalPlanned.toString());
                  setIsEditingBudget(true);
                }}
                className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-800/80 px-2 py-0.5 -mr-2 rounded transition-all duration-150 justify-end"
                title="Clique para redefinir o caixa inicial planejado"
              >
                <p className="text-lg font-mono font-bold text-emerald-400">
                  R$ {totalPlanned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <Sliders className="w-3 h-3 text-slate-500 hover:text-emerald-300 transition-colors" />
              </div>
            )}
          </div>
          
          {/* Real adjusted expected ROI */}
          <div className="text-right">
            <p className="text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">ROI Real Ajustado</p>
            <p className={`text-lg font-mono font-bold ${totals.realProjectedRoiPercentage >= 50 ? 'text-indigo-400' : 'text-amber-500'}`}>
              {totals.realProjectedRoiPercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* Sidebar: Sourcing runs, Sells channels, and categories */}
        <aside className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-5 flex flex-col shrink-0 overflow-y-auto">
          
          {/* SUPPLIER SOURCING LOGISTICS MANAGER (Crucial to travel/fuel tracking) */}
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm text-left">
            <div className="flex items-center gap-2 pb-2.5 border-b border-light border-slate-200/60 mb-3">
              <Truck className="w-4 h-4 text-indigo-600" />
              <h4 className="text-slate-900 font-bold text-xs uppercase tracking-wider">
                Viagens ao Fornecedor
              </h4>
            </div>
            
            <p className="text-[11px] text-slate-500 mb-3 leading-snug">
              Você vende de casa, mas precisa retirar mercadorias no fornecedor. Registre seus gastos de viagem (passagem, gasolina, pedágio) para apurar o lucro real final ajustado.
            </p>

            <div className="space-y-3">
              {/* Cost per Supplier travel run */}
              <div>
                <label className="block text-[9px] font-extrabold text-slate-600 uppercase mb-1">
                  Custo Unitário da Viagem (R$)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400 font-mono text-xs font-semibold">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    className="w-full bg-white text-xs text-slate-800 pl-8 pr-3 py-1.5 rounded-md border border-slate-200 focus:border-indigo-500 focus:outline-none transition"
                    value={tripExpense}
                    onChange={(e) => setTripExpense(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
              </div>

              {/* Number of Trips Sourced */}
              <div>
                <label className="block text-[9px] font-extrabold text-slate-600 uppercase mb-1">
                  Número de Viagens Efetuadas
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-white text-xs text-slate-800 px-3 py-1.5 rounded-md border border-slate-200 focus:border-indigo-500 focus:outline-none transition"
                    value={tripsCount}
                    onChange={(e) => setTripsCount(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <div className="flex flex-col shrink-0 gap-0.5">
                    <button 
                      onClick={() => setTripsCount(prev => prev + 1)}
                      className="px-2 py-0.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border rounded"
                    >
                      +
                    </button>
                    <button 
                      onClick={() => setTripsCount(prev => Math.max(0, prev - 1))}
                      className="px-2 py-0.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border rounded"
                    >
                      -
                    </button>
                  </div>
                </div>
              </div>

              {/* Travel runs math output */}
              <div className="bg-rose-50/50 border border-rose-100 p-2.5 rounded-lg text-xs leading-none">
                <div className="flex justify-between text-slate-600 mb-1.5">
                  <span>Custo total de viagens:</span>
                  <span className="font-mono font-bold text-rose-600">
                    R$ {(tripExpense * tripsCount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  *Esse valor será debitado do caixa geral para simular sua margem de sobrevivência operacional.
                </p>
              </div>
            </div>
          </div>

          {/* CHANNELS QUICK FILTERS */}
          <div className="mb-5">
            <h3 className="text-slate-900 font-bold text-xs uppercase tracking-wider mb-2.5 flex items-center">
              <Store className="w-3.5 h-3.5 mr-2 text-indigo-600" />
              Canais de Venda
            </h3>
            
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setSelectedChannelFilter(selectedChannelFilter === 'ml' ? null : 'ml')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition text-center truncate ${
                  selectedChannelFilter === 'ml'
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Filtrar produtos ativos no Mercado Livre"
              >
                M. Livre
              </button>
              <button
                onClick={() => setSelectedChannelFilter(selectedChannelFilter === 'shopee' ? null : 'shopee')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition text-center truncate ${
                  selectedChannelFilter === 'shopee'
                    ? 'bg-orange-100 border-orange-300 text-orange-850'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Filtrar por Shopee"
              >
                Shopee
              </button>
              <button
                onClick={() => setSelectedChannelFilter(selectedChannelFilter === 'direto' ? null : 'direto')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition text-center truncate ${
                  selectedChannelFilter === 'direto'
                    ? 'bg-indigo-100 border-indigo-200 text-indigo-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Filtrar por Vendas Diretas"
              >
                Direto
              </button>
            </div>
          </div>

          {/* ACTIVE CATEGORIES FILTER cards */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center">
                <Layers className="w-3.5 h-3.5 mr-2 text-indigo-600" />
                Filtrar Categoria
              </h3>
              {(selectedCategory || selectedChannelFilter) && (
                <button 
                  onClick={() => { setSelectedCategory(null); setSelectedChannelFilter(null); }}
                  className="text-[10px] text-indigo-600 font-bold hover:underline bg-indigo-50 px-2 py-0.5 rounded-full"
                >
                  Limpar Todos
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {RECOMMENDED_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.name;
                const countInStore = items.filter(item => item.category === cat.name).length;
                
                return (
                  <div 
                    key={cat.name}
                    onClick={() => setSelectedCategory(isActive ? null : cat.name)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition relative group ${
                      isActive 
                        ? 'border-indigo-400 bg-indigo-50/70 shadow-sm' 
                        : 'border-slate-200 bg-white hover:border-indigo-250 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <p className={`text-xs font-bold uppercase tracking-wide ${isActive ? 'text-indigo-800' : 'text-slate-800'}`}>
                        {cat.name}
                      </p>
                      <span className="text-[9px] font-mono font-bold px-1.5 bg-slate-100 text-slate-500 rounded">
                        {countInStore} un.
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 pr-6 leading-normal">
                      {cat.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reset / Status bar */}
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2.5 shrink-0">
            <button
              onClick={handleResetData}
              className="w-full flex items-center justify-center gap-2 py-1.5 border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg text-[10px] font-semibold transition"
              title="Redefinir simulador"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Simulação Inicial
            </button>
            
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-left">
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-indigo-500" />
                Vercel Status
              </span>
              <div className="flex items-center text-[11px] text-emerald-600 font-semibold mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                Ambiente Online
              </div>
            </div>
          </div>
        </aside>

        {/* Main Data Panel */}
        <section className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
          
          {/* Top Real Stats Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Total Out_of_pocket Investment */}
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-slate-450 text-[9px] font-extrabold uppercase tracking-wide mb-1 block">
                CUSTO TOTAL DE AQUISIÇÃO
              </span>
              <p className="text-lg font-bold font-mono text-slate-900 leading-tight">
                R$ {totals.investedOutofPocket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-1.5 pt-1.5 border-t border-slate-150 text-[10px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Preço Fornecedor:</span>
                  <span className="font-mono text-slate-600">R$ {totals.originalStockCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Custo Embalagens:</span>
                  <span className="font-mono text-slate-600">R$ {totals.totalPackagingOverall.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Retirada (Rateada):</span>
                  <span className="font-mono text-slate-600">R$ {totals.totalItemTransportOverhead.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Retained Commissions */}
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-slate-450 text-[9px] font-extrabold uppercase tracking-wide mb-1 block">
                  TAXAS E TARIFAS DE PLATAFORMA
                </span>
                <p className="text-lg font-bold font-mono text-slate-900 leading-tight">
                  R$ {totals.totalPlatformFees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Taxas estimadas retidas por ML e Shopee.
                </p>
              </div>
              <div className="bg-slate-50 p-1.5 rounded text-[9px] font-mono text-slate-500 text-center mt-2">
                Preço Médio de Comissão: {totals.totalPotentialRevenue > 0 ? ((totals.totalPlatformFees / totals.totalPotentialRevenue) * 100).toFixed(1) : '0'}%
              </div>
            </div>

            {/* KPI 3: Potential Selling Revenue */}
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-slate-450 text-[9px] font-extrabold uppercase tracking-wide mb-1 block">
                  RECEITA BRUTA ESTIMADA
                </span>
                <p className="text-lg font-bold font-mono text-slate-900 leading-tight">
                  R$ {totals.totalPotentialRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="mt-1 text-[10px] text-slate-400">
                  Saldo de caixa planejado pós-liquidação:
                </div>
              </div>
              <p className="text-[11px] font-semibold text-emerald-600 font-mono">
                R$ {(totalPlanned - totals.investedOutofPocket + totals.totalPotentialRevenue - totals.totalPlatformFees - totals.logisticsOverheadTravel).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* KPI 4: Adjusted Real Net Profit */}
            <div className="bg-indigo-650 p-4.5 rounded-xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-15">
                <TrendingUp className="w-20 h-20 stroke-[3]" />
              </div>

              <div>
                <span className="text-indigo-200 text-[9px] font-extrabold uppercase tracking-wide mb-0.5 block">
                  LUCRO REAL APURADO (AJUSTADO)
                </span>
                <p className="text-xl font-bold font-mono leading-none">
                  R$ {totals.realNetProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="text-[10px] text-indigo-100/90 mt-1 leading-snug">
                  Deduzindo R$ {totals.logisticsOverheadTravel.toFixed(2)} de custos de viagens para sourcing de mercadorias.
                </div>
              </div>

              <div className="flex justify-between items-center bg-indigo-700/60 p-2 rounded text-[10px] font-mono mt-3 text-white/90">
                <span>ROI Líquido:</span>
                <span className="font-bold">{totals.realProjectedRoiPercentage.toFixed(1)}%</span>
              </div>
            </div>
            
          </div>

          {/* Table Container Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col min-h-[350px]">
            
            {/* Table Control Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Análise Detalhada dos Custos das Mercadorias
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Visualização de custos de fornecedor, taxas de frete/comissão de e-commerce e insumos físicos de embalagens.
                </p>
              </div>

              {/* Action Buttons and Search Input nested */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400 hover:pointer-events-none">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Pesquise por nome / categoria..."
                    className="w-full bg-white text-xs text-slate-800 pl-8 pr-3 py-1.5 rounded-md border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <button 
                  onClick={openAddModal}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-sm transition flex items-center gap-1.5"
                  id="add-product-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + CADASTRAR PRODUTO
                </button>
              </div>
            </div>

            {/* Detailed Cost Grid Table */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-slate-400 border-b border-slate-200 uppercase font-bold bg-slate-50/50 sticky top-0 bg-white">
                    <th className="p-4 pl-5">Produto / Categoria</th>
                    <th className="p-4 text-center">Canal de Venda</th>
                    <th className="p-4 text-center">Estoque / Qtd</th>
                    <th className="p-4 text-right">Insumos (Forn. + Emb.)</th>
                    <th className="p-4 text-right">Retirada (Item)</th>
                    <th className="p-4 text-right">Taxa Canal</th>
                    <th className="p-4 text-right bg-indigo-50/20">Preço Venda</th>
                    <th className="p-4 text-center">L. Líquido Un. (Margem)</th>
                    <th className="p-4 text-center">ROI Un.</th>
                    <th className="p-4 text-right pr-5">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100 bg-white">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-1 bg-slate-50/20 py-6 rounded-lg border border-dashed border-slate-200">
                          <Info className="w-6 h-6 text-slate-350" />
                          <p className="font-semibold text-slate-500 mt-1">Nenhum estoque simula com os filtros atuais</p>
                          <p className="text-[11px] text-slate-400">Tente limpar busca ou selecionar outra categoria.</p>
                          <button
                            onClick={() => { setSelectedCategory(null); setSelectedChannelFilter(null); setSearchQuery(''); }}
                            className="mt-2 text-indigo-600 font-bold hover:underline py-1 px-3 bg-indigo-50 rounded"
                          >
                            Limpar Filtros de Busca
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const f = calculateItemFinancials(item);

                      // Determine active beautiful badges for Sales Channel
                      let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                      let badgeIcon = <Store className="w-3 h-3 text-slate-600" />;
                      
                      switch (item.channel) {
                        case 'ml_classico':
                          badgeStyle = 'bg-amber-50 text-amber-805 border-amber-200';
                          badgeIcon = <span className="text-[9px] font-black text-amber-700 mr-1">ML Clássico</span>;
                          break;
                        case 'ml_premium':
                          badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold';
                          badgeIcon = <span className="text-[9px] font-black text-amber-800 mr-1">ML Premium</span>;
                          break;
                        case 'shopee':
                          badgeStyle = 'bg-orange-50 text-orange-850 border-orange-200';
                          badgeIcon = <span className="text-[9px] font-black text-orange-600 mr-1">Shopee 14%</span>;
                          break;
                        case 'shopee_frete':
                          badgeStyle = 'bg-orange-100 text-orange-950 border-orange-300 font-extrabold animate-pulse-slow';
                          badgeIcon = <span className="text-[9px] font-black text-orange-700 mr-1">Shopee Grátis (20%)</span>;
                          break;
                        case 'direto':
                          badgeStyle = 'bg-teal-50 text-teal-800 border-teal-200';
                          badgeIcon = <span className="text-[9px] font-black text-teal-600 mr-1">Direto</span>;
                          break;
                      }

                      // Dynamic alert levels colors based on ROI percentage
                      let colorClass = 'text-rose-600 bg-rose-50 border-rose-100';
                      let dotColor = 'bg-rose-500';
                      let recommendationText = 'Cuidado';

                      if (f.roiPercentage >= 100) {
                        colorClass = 'text-emerald-700 bg-emerald-50 border-emerald-100';
                        dotColor = 'bg-emerald-500';
                        recommendationText = 'Excelente';
                      } else if (f.roiPercentage >= 50) {
                        colorClass = 'text-amber-750 bg-amber-50 border-amber-100';
                        dotColor = 'bg-amber-500';
                        recommendationText = 'Aceitável';
                      }

                      return (
                        <tr 
                          key={item.id} 
                          className="hover:bg-slate-50/70 transition-colors duration-150 group shrink-0"
                          id={`item-row-${item.id}`}
                        >
                          {/* Item/Category */}
                          <td className="p-4 pl-5">
                            <div className="font-semibold text-slate-900 group-hover:text-indigo-950 leading-tight">
                              {item.name}
                            </div>
                            <span className="text-[9px] text-slate-500 bg-slate-100 border font-mono px-1.5 py-0.5 rounded mt-1.5 inline-block uppercase font-bold">
                              {item.category}
                            </span>
                          </td>
                          
                          {/* Sales Channel Badge */}
                          <td className="p-4 text-center whitespace-nowrap">
                            <div className={`p-1.5 rounded-lg border text-center text-[10px] inline-flex items-center gap-1 ${badgeStyle}`}>
                              {badgeIcon}
                            </div>
                          </td>

                          {/* Inventory count */}
                          <td className="p-4 text-center font-mono font-medium text-slate-600 whitespace-nowrap">
                            {item.quantity} unidades
                            <p className="text-[9px] text-slate-450 font-normal">
                              Custo total: R$ {(item.cost * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </td>

                          {/* Original item cost + packing cost */}
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="font-mono text-slate-700 font-semibold">
                              R$ {(item.cost + item.packagingCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[9px] text-slate-400 space-y-0.5">
                              <div>Forn: R$ {item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                              <div>Embal: R$ {(item.packagingCost ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                            </div>
                          </td>

                          {/* Proportional transport pick-up cost */}
                          <td className="p-4 text-right whitespace-nowrap font-mono text-slate-600">
                            R$ {(item.unitTransportCost ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            <p className="text-[9px] text-slate-400 font-sans">
                              (Busca no fornecedor)
                            </p>
                          </td>

                          {/* Comissions platform fee */}
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="font-mono text-slate-650">
                              R$ {f.platformFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-[9px] text-slate-450 font-sans">
                              {f.flatFee > 0 ? `Taxa fixa + ${f.feePct * 100}%` : `${f.feePct * 100}%`}
                            </p>
                          </td>

                          {/* Sales price target */}
                          <td className="p-4 text-right whitespace-nowrap bg-indigo-50/25">
                            <span className="font-mono font-bold text-slate-900 text-[13px]">
                              R$ {item.salePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </td>

                          {/* Net profit unit (and contribution margin) */}
                          <td className="p-2 text-center whitespace-nowrap">
                            <div className="font-mono font-bold text-slate-800 text-[12px]">
                              R$ {f.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="mt-1">
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded text-[9px] tracking-wide">
                                Margem: {f.marginPercentage.toFixed(0)}%
                              </span>
                            </div>
                          </td>

                          {/* ROI calculated from raw cost of material + travel share */}
                          <td className="p-2 text-center whitespace-nowrap">
                            <div className={`text-[12px] font-extrabold ${
                              f.roiPercentage >= 100 ? 'text-emerald-600' : f.roiPercentage >= 50 ? 'text-amber-600' : 'text-rose-600'
                            }`}>
                              {f.roiPercentage.toFixed(1)}%
                            </div>
                            
                            {/* Alert rating pills */}
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold ${colorClass} mt-1.5`}>
                              <span className={`w-1 h-1 rounded-full ${dotColor}`}></span>
                              {recommendationText}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right pr-5 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5 font-normal">
                              <button
                                onClick={(e) => openEditModal(item, e)}
                                className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-indigo-650 rounded transition"
                                title="Editar configurações de comissão e custos"
                                id={`edit-${item.id}`}
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-600 hover:text-indigo-600 focus:outline-none" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(item.id, e)}
                                className="p-1 px-1.5 bg-slate-150 hover:bg-rose-50 text-slate-600 hover:text-rose-650 rounded transition"
                                title="Excluir produto"
                                id={`delete-${item.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-slate-600 hover:text-rose-600 focus:outline-none" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Helper Banner about Sells Rules */}
            <div className="bg-slate-50 border-t border-slate-250 p-3.5 px-5 text-slate-550 text-[10.5px] leading-relaxed select-text flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex items-center gap-2 font-bold text-slate-700 shrink-0">
                <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                DICA DE PRECIFICAÇÃO:
              </div>
              <p className="flex-1">
                <strong>Mercado Livre:</strong> Cobra R$ 6,00 adicionais fixa se o preço de venda for menor que R$ 79,00. <strong>Shopee:</strong> Retém comissão padrão (14%) ou Frete Grátis (20%), acrescido de R$ 3,00 de taxa fixa operacional por unidade vendida do catálogo.
              </p>
            </div>
          </div>

          {/* Footer Metadata Summary */}
          <div className="mt-auto flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 gap-2 shrink-0 select-text">
            <p>© 2026 MarginMaster System • Desenvolvido para Venda Residencial e Retirada no Fornecedor</p>
            <p className="font-mono flex items-center gap-1 bg-white p-1 rounded border border-slate-200">
              Ambiente: <span className="text-indigo-500 font-bold uppercase">PROD-Sourcing-V2</span> 
              <span className="text-slate-350">•</span> 
              Última Sincronização: <span className="text-slate-600 font-bold">Local Storage Ativo</span>
            </p>
          </div>
        </section>
      </main>

      {/* Item Form Modal (Add / Edit) with interactive fields */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-4 animate-fade-in animate-duration-150">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col">
            
            {/* Modal Interior Fields */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-slate-150">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  {editingItem ? 'Configurar Custos e Comissões' : 'Cadastrar Novo Item'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1 rounded-full transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3.5 text-left">
                {/* Nome do Item */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-650 uppercase mb-1">Nome do Produto</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fone Bluetooth Pro G2, Cabo Reforçado"
                    className="w-full bg-white text-xs text-slate-800 px-3 py-2 rounded-md border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition font-medium"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

                {/* Grid row: Category & Quantity */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-650 uppercase mb-1">Categoria de Estoque</label>
                    <select
                      className="w-full bg-white text-xs text-slate-850 px-2.5 py-2 rounded-md border border-slate-200 focus:border-indigo-500 focus:outline-none transition cursor-pointer font-medium"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                    >
                      <option value="Acessórios Tech">Acessórios Tech</option>
                      <option value="Beleza & Skincare">Beleza & Skincare</option>
                      <option value="Home Office">Home Office</option>
                      <option value="Geral">Outros / Geral</option>
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-650 uppercase mb-1">Qtd Comprada / Estoque</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full bg-white text-xs text-slate-800 px-3 py-1.5 rounded-md border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition font-mono font-semibold"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value)}
                    />
                  </div>
                </div>

                {/* CHANNELS SELECT WITH FIXED PRESET FOR COMMISSIONS */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-650 uppercase mb-1">
                    Canal de Venda & Regra de Comissão
                  </label>
                  <select
                    className="w-full bg-white text-xs text-slate-850 px-2.5 py-2 rounded-md border border-slate-200 focus:border-indigo-500 focus:outline-none transition cursor-pointer font-semibold"
                    value={formChannel}
                    onChange={(e) => setFormChannel(e.target.value as any)}
                  >
                    <option value="ml_classico">Mercado Livre Clássico (12% comissão + R$6,00 fixo se menor de R$79)</option>
                    <option value="ml_premium">Mercado Livre Premium (17% comissão + Parcelamento s/ juros + R$6,00 fixo se menor de R$79)</option>
                    <option value="shopee">Shopee Padrão (14% comissão + R$3,00 taxa fixa)</option>
                    <option value="shopee_frete">Shopee com Frete Grátis (20% comissão + R$3,00 taxa fixa)</option>
                    <option value="direto">Venda Direta / Balcão (0% comissão, taxa zerada)</option>
                  </select>
                </div>

                {/* Grid row: Supplier purchase cost & target sale price */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Cost Price */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-indigo-700 uppercase mb-1 flex items-center gap-1.5">
                      <Store className="w-3 h-3" /> Cost Fornecedor (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400 font-mono text-xs">R$</span>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full bg-white text-xs text-slate-850 pl-8 pr-3 py-2 rounded-md border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition font-mono font-bold"
                        value={formCost}
                        onChange={(e) => setFormCost(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Sale Price */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-emerald-700 uppercase mb-1 flex items-center gap-1.5">
                      Preço de Venda Final (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400 font-mono text-xs">R$</span>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full bg-white text-xs text-slate-850 pl-8 pr-3 py-2 rounded-md border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition font-mono font-bold"
                        value={formSalePrice}
                        onChange={(e) => setFormSalePrice(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Grid row: Detailed packaging cost & individual sourcing pickup shares */}
                <div className="grid grid-cols-2 gap-4 pt-1.5 pb-1">
                  {/* Packaging Cost */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-650 uppercase mb-1 flex items-center gap-1">
                      <Box className="w-3 h-3 text-slate-500" /> Embalagem unitária (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400 font-mono text-xs">R$</span>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0"
                        className="w-full bg-white text-xs text-slate-800 pl-8 pr-3 py-2 rounded-md border border-slate-200 focus:border-indigo-500 focus:outline-none transition font-mono"
                        value={formPackagingCost}
                        onChange={(e) => setFormPackagingCost(e.target.value)}
                        title="Quanto gasta com fita, papel bolha, etiqueta e envelope/papel por embalagem"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 pl-0.5 mt-1 block">Insumos p/ enviar de casa</span>
                  </div>

                  {/* Individual travel share */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-650 uppercase mb-1 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-slate-500" /> Rateio Retirada (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-400 font-mono text-xs">R$</span>
                      <input
                        type="number"
                        required
                        step="0.10"
                        min="0"
                        className="w-full bg-white text-xs text-slate-800 pl-8 pr-3 py-2 rounded-md border border-slate-200 focus:border-indigo-500 focus:outline-none transition font-mono"
                        value={formUnitTransportCost}
                        onChange={(e) => setFormUnitTransportCost(e.target.value)}
                        title="Proporção da despesa de transporte da busca no fornecedor atribuída a esta unidade"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 pl-0.5 mt-1 block">Frete ou gas p/ ir buscar o lote</span>
                  </div>
                </div>

                {/* Smart Live Preview Box inside Modal */}
                <div className="bg-slate-50 rounded-xl p-4 border border-indigo-100 shadow-inner">
                  <span className="block text-[9px] font-black text-indigo-800 uppercase tracking-widest mb-2 border-b pb-1">
                    Análise Prática de Margem (Simulação Unitária)
                  </span>
                  
                  <div className="grid grid-cols-2 gap-y-1.5 text-xs text-slate-600 font-sans">
                    <div className="flex justify-between items-center text-slate-500 pr-2">
                      <span>Custo de Aquisição:</span>
                      <span className="font-mono text-slate-700 font-semibold">
                        R$ {modalLiveCalculations.spentCapital.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Taxas da Plataforma:</span>
                      <span className="font-mono text-rose-600 font-bold">
                        R$ {modalLiveCalculations.platformFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 pr-2">
                      <span>Preço Recomendado:</span>
                      <span className="font-mono text-slate-700 font-semibold">
                        R$ {Number(formSalePrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Lucro Líquido Unitário:</span>
                      <span className={`font-mono font-bold ${modalLiveCalculations.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        R$ {modalLiveCalculations.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pr-2 border-t border-slate-150 pt-2.5 mt-1 text-slate-500">
                      <span>Margem de Contribuição:</span>
                      <span className="font-mono font-black text-emerald-700 text-[11px]">
                        {modalLiveCalculations.marginPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-150 pt-2.5 mt-1 text-slate-500">
                      <span>ROI do Investimento:</span>
                      <span className={`font-mono font-black text-[11px] ${
                        modalLiveCalculations.roiPercentage >= 100 ? 'text-emerald-600' : modalLiveCalculations.roiPercentage >= 50 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {modalLiveCalculations.roiPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit buttons */}
                <div className="flex gap-2 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 border rounded-md transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md shadow hover:shadow-indigo-500/20 transition cursor-pointer"
                  >
                    {editingItem ? 'Enviar e Salvar' : 'Confirmar e Inserir'}
                  </button>
                </div>
              </form>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
