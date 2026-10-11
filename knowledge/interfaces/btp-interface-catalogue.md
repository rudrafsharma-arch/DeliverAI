# Snck-Hnw BTP Integration Suite - Interface Catalogue
# Source: SAP BTP Integration Suite exported packages
# Client: Snack/Heinz (Snck-Hnw) - S/4HANA Public Cloud
# Total: 175+ iFlows | 20+ packages | 4 workstreams

## Naming Convention
Format: {System}_{Client}_{BusinessUnit}-{Process}_{Type}
- Sys = Sender iFlow (picks up from source system)
- Prc = Process/Receiver iFlow (posts to target system)
- Client codes: Snck-Hnw, Kind, NB, CS (Creative Snacks), TruFru
- Workstreams: P2P, OTC, MFG, RTR

## BlueYonder_Common_Sys (16 iFlows)
BlueYonder_Snck-Hnw_Kind-PurchaseOrders_Sys | SFTP->S4HPC OData | P2P | v1.0.9
BlueYonder_Snck-Hnw_Kind-PurchaseContracts_Sys | SFTP->S4HPC | P2P | v1.0.4
BlueYonder_Snck-Hnw_Kind-STO_Sys | Stock Transfer Orders | P2P | v1.0.6
BlueYonder_Snck-Hnw_Common-PlannedOrder-Sftp_Sys | S4HPC->BY SFTP | MFG | v1.0.4
BlueYonder_Snck-Hnw_Common-ProcessOrder-Sftp_Sys | S4HPC->BY SFTP | MFG | v1.0.3
BlueYonder_Snck-Hnw_Common-OnHandInventory-Sftp_Sys | S4HPC->BY SFTP | P2P | v1.0.6
BlueYonder_Snck-Hnw_Common-CustomerOrder-Sftp_Sys | S4HPC->BY SFTP | OTC | v1.0.4
BlueYonder_Snck-Hnw_Common-SalesOrderHistory-Sftp_Sys | S4HPC->BY SFTP | OTC | v1.0.6
BlueYonder_Snck-Hnw_Common-InTransitOrders-Sftp_Sys | S4HPC->BY SFTP | P2P | v1.0.6
BlueYonder_Snck-Hnw_InterfacesTransferComplete-KIND-CS-Daily_Sys | Done file daily | ALL | v1.0.25
BlueYonder_Snck-Hnw_InterfacesTransferComplete-KIND-CS-Monthly_Sys | Done file monthly | ALL | v1.0.1
BlueYonder_Snck-Hnw_InterfacesTransferComplete-KIND-CS-Weekly_Sys | Done file weekly | ALL | v1.0.2
BlueYonder_Snck-Hnw_TruFru-PurchaseContracts_Sys | TruFru contracts | P2P | v1.0.2
BlueYonder_Snck-Hnw_CreativeSnacks-PlanningFile_Sys | CS Planning Files | MFG | v1.0.4
S4hpc_Snck-Hnw_BlueYonder-InterfacesTransferComplete_Prc | Transfer complete Prc | ALL | v1.0.24

## S4hpc_Common_Sys (33 Sender iFlows)
S4hpc_Snck-Hnw_Kind-OnHandInventory_Sys
S4hpc_Snck-Hnw_Kind-PurchaseOrder-1163_Sys
S4hpc_Snck-Hnw_Kind-CustomerOrder_Sys
S4hpc_Snck-Hnw_Kind-SalesOrderHistory_Sys
S4hpc_Snck-Hnw_Kind-SalesInvoiceHeader_Sys
S4hpc_Snck-Hnw_Kind-SalesInvoiceDetail_Sys
S4hpc_Snck-Hnw_Kind-MaterialMasterItemCrossRef_Sys
S4hpc_Snck-Hnw_Kind-WorkOrder-1163_Sys
S4hpc_Snck-Hnw_Kind-WorkOrder-1170_Sys
S4hpc_Snck-Hnw_Kind-InTransitOrders_Sys
S4hpc_Snck-Hnw_Kind-InventoryAdjustment_Sys
S4hpc_Snck-Hnw_Kind-Inspectionlot_Sys
S4hpc_Snck-Hnw_Kind-Open-AR-Extract_Sys
S4hpc_Snck-Hnw_Kind-StockTransfer-InboundDelivery_Sys
S4hpc_Snck-Hnw_Kind-WarehouseShippingOrderForTransfers_Sys
S4hpc_Snck-Hnw_Kind-UberFreight-PostGoodsIssue_Sys
S4hpc_Snck-Hnw_Kind-PecoFile_Sys
S4hpc_Snck-Hnw_Kind-SalesInvoiceData-US-POD_Sys
S4hpc_Snck-Hnw_Kind-SalesInvoiceData-CA-POD_Sys
S4hpc_Snck-Hnw_Kind-SalesOrderInfo-1163_Sys
S4hpc_Snck-Hnw_Kind-SalesOrderInfo-1170_Sys
S4hpc_Snck-Hnw_Kind-CustomerPaymentHistory_Sys
S4hpc_Snck-Hnw_Kind-ClearARExtract_Sys
S4hpc_Snck-Hnw_Kind-SalesinvoicePDF_Sys
S4hpc_Snck-Hnw_Kind-StockTransfer-InboundDelivery_Sys
S4hpc_Snck-Hnw_CreativeSnacks-PlannedOrder_Sys
S4hpc_Snck-Hnw_CreativeSnacks-ProcessOrders_Sys
S4hpc_Snck-Hnw_CreativeSnacks-OnHandInventory_Sys
S4hpc_Snck-Hnw_CreativeSnacks-InTransitOrders_Sys
S4hpc_Snck-Hnw_CreativeSnacks-WarehouseShippingOrderForTransfers_Sys
S4hpc_Snck-Hnw_CreativeSnacks-Inspectionlot_Sys
S4hpc_Snck-Hnw_TruFru-Inspectionlot_Sys
S4hpc_Snck-Hnw_Trufru-InventoryAdjustment_Sys
S4hpc_Snck-Hnw_NB-Inspectionlot_Sys

## S4hpc_Snck-Hnw_P2P_Prc (30 Process iFlows - Procure to Pay)
S4hpc_Snck-Hnw_PurchaseOrders_Prc
S4hpc_Snck-Hnw_PurchaseOrderAndWorkOrder_Prc
S4hpc_Snck-Hnw_InventoryAdjustment-Inbound_Prc
S4hpc_Snck-Hnw_InventoryAdjustment-Outbound_Prc
S4hpc_Snck-Hnw_GoodsReceipt-InboundDelivery_Prc
S4hpc_Snck-Hnw_GoodsReceipt-InboundDelivery-MissingLineItem_Prc
S4hpc_Snck-Hnw_GoodsReceipt-InboundDelivery-Info_Prc
S4hpc_Snck-Hnw_InboundDelivery_Prc
S4hpc_Snck-Hnw_SupplierInvoice_Prc
S4hpc_Snck-Hnw_OnHandInventory_Prc
S4hpc_Snck-Hnw_MaterialDocument_Prc
S4hpc_Snck-Hnw_Inspectionlot_Prc
S4hpc_Snck-Hnw_InspectionLot-Batch-Update_Prc
S4hpc_Snck-Hnw_CarrierShipment_Prc
S4hpc_Snck-Hnw_StockTransportOrders_Prc
S4hpc_Snck-Hnw_StockTransfer-InboundDelivery_Prc
S4hpc_Snck-Hnw_WarehouseShippingOrderForTransfers_Prc
S4hpc_Snck-Hnw_InTransitOrders_Prc
S4HPC_SNCK-HNW_PurchaseContracts_PRC
S4hpc_Snck-Hnw_PecoFile_Prc
S4hpc_Snck-Hnw_Customer-Return-from-TruCommerce_Prc
S4hpc_Snck-Hnw_CustomerReturn-PickUpQTY-from-TruCommerce_Prc
S4hpc_Snck-Hnw_UpdatePurchaseOrder-OutboundDelivery_Prc
S4hpc_Snck-Hnw_APILoadPlan_Prc
S4hpc_Snck-Hnw_APILoadPlan-Etag_Prc
S4hpc_Snck-Hnw_Kind-InventoryInquiry_Prc
S4hpc_Snck-Hnw_Kind-Nulogy-Adjustment_Prc
S4hpc_Snck-Hnw_PurchasingPricingCondition_Prc
S4hpc_Snck-Hnw_PurchasingPricingCondition-ErrorFile_Prc
S4HPC_HW_P2P-PO-MaterialDocument-from-TruCommerce_Sys

## S4hpc_Snck-Hnw_OTC_Prc (13 Process iFlows - Order to Cash)
S4hpc_Snck-Hnw_CustomerOrder_Prc
S4hpc_Snck-Hnw_SalesInvoiceHeader_Prc
S4hpc_Snck-Hnw_SalesInvoiceDetail_Prc
S4hpc_Snck-Hnw_SalesOrderHistory_Prc
S4hpc_Snck-Hnw_SalesOrderInfo_Prc
S4hpc_Snck-Hnw_SalesInvoiceDataPOD_Prc
S4hpc_Snck-Hnw_UberFreight-PostGoodsIssue_Prc
S4hpc_Snck-Hnw_MaterialMasterItemCrossRef_Prc
S4hpc_Snck-Hnw_OTC-Kind-OutboundDelivery-from-TruCommerce_Prc
S4hpc_Snck-Hnw_OTC-Kind-HandlingUnit-from-TruCommerce_Prc
S4hpc_Snck-Hnw_OTC-Kind-CreateSubLineItem-OutbondDelivery-from-TruCommerce_Prc
S4hpc_Snck-Hnw_Promotions_Prc
S4hpc_Snck-Hnw_ValoFileForSampleOrders_Prc

## S4hpc_Snck-Hnw_MFG_Prc (7 Process iFlows - Manufacturing)
S4hpc_Snck-Hnw_ProcessOrder_Prc
S4hpc_Snck-Hnw_PlannedOrder_Prc
S4hpc_Snck-Hnw_PlanningFile-Firmed_Prc
S4hpc_Snck-Hnw_PlanningFile-NonFirmed_Prc
S4hpc_Snck-Hnw_PlanningFile-ProductionVersion_Prc
S4hpc_Snck-Hnw_PlanningFile-InfoLogger_Prc
S4hpc_Snck-Hnw_PlanningFile-ErrorFile_Prc

## S4hpc_Snck-Hnw_RTR_Prc (10 Process iFlows - Record to Report)
S4hpc_Snck-Hnw_BankStatement_Prc
S4hpc_Snck-Hnw_Open-and-Clear-AR-Extract_Prc
S4hpc_Snck-Hnw_CustomerPaymentHistory_Prc
S4hpc_Snck-Hnw_NonTradeDeduction_Prc
S4hpc_Snck-Hnw_JournalEntryBulkCreateRequest_Prc
S4hpc_Snck-Hnw_GLAccount_Prc
S4hpc_Snck-Hnw_MRM-BringYourOwnRates-FromBloomberg_Prc
S4hpc_Snck-Hnw_ReasonCodeExtract_Prc
S4hpc_Snck-Hnw_CheckRequest-CustomerPromotions_Prc
S4hpc_Snck-Hnw_CheckAndFetch-NextPostingDate_Sys

## TrueCommerce_Common_Sys (18 iFlows - WMS/EDI)
TrueCommerce_Snck-Hnw_Kind-GoodsReceipt-InboundDelivery_Sys
TrueCommerce_Snck-Hnw_Kind-InventoryAdjustment_Sys
TrueCommerce_Snck-Hnw_Kind-Ship-Confirmation-for-Standard-PO_Sys
TrueCommerce_Snck-Hnw_OTC-Kind-OutboundDelivery-Split_Sys
TrueCommerce_Snck-Hnw_OTC-Kind-OutboundDelivery-Validation_Sys
TrueCommerce_Snck-Hnw_Common-PurchaseOrder-Sftp_Sys
TrueCommerce_Snck-Hnw_Common-WorkOrder-Sftp_Sys
TrueCommerce_Snck-Hnw_Common-StockTransfer-InboundDelivery-Sftp_Sys
TruCommerce_Snck-Hnw_Kind-Customer-Return_Sys
TrueCommerce_Snck-Hnw_Kind-NulogyAdjustment_Sys
TrueCommerce_Snck-Hnw_Kind-InventoryInquiry_Sys
TrueCommerce_Snck-Hnw_Kind-ForecastReport_Sys
TrueCommerce_Snck-Hnw_Kind-WarehouseInventoryAdjustmentAdvice_Sys
TrueCommerce_Snck-Hnw_Trufru-InventoryAdjustment_Sys
TrueCommerce_Snck-Hnw_Kind-ShipNoticeManifest_Sys
TruCommerce_Hw_Common-PO-MaterialDocument-Split_Sys
TruCommerce_Snck-Hnw_Kind-Nulogy-RePackers-in-Nashville_Sys
TrueCommerce_Snck-hnw_Common-InventoryAdjustment-Sftp_Sys

## HighRadius_Common_Sys (10 iFlows - AR Automation)
HighRadius_Snck-Hnw_Kind-CashApplicationFile_Sys
HighRadius_Snck-Hnw_Common-SalesInvoiceHeader-Sftp_Sys
HighRadius_Snck-Hnw_Common-SalesInvoiceDetail-Sftp_Sys
HighRadius_Snck-Hnw_Common-SalesInvoicePODData-Sftp_Sys
HighRadius_Snck-Hnw_Common-Open-and-ClearAR-Extract-Sftp_Sys
HighRadius_Snck-Hnw_Common-CustomerPaymentHistory-Sftp_Sys
HighRadius_Snck-Hnw_Kind-NonTradeDeductionResolutionFile_Sys
HighRadius_Snck-Hnw_Common-MaterialMasterItemCrossRef-Sftp_Sys
HighRadius_Snck-Hnw_Kind-SplitFile_Sys
HighRadius_Snck-Hnw_Kind-ReasonCodeExtract_Sys

## Coupa_Common_Sys
Coupa_Snck-Hnw_Kind-SupplierInvoice_Sys
Coupa_Snck-Hnw_Kind-CoupaPaymentStatus_Prc

## EventMesh_Common_Sys (7 iFlows)
EventMesh_Snck-Hnw_Kind-PurchaseOrder-CreatedEvents_Sys
EventMesh_Snck-Hnw_Kind-PurchaseOrder-ChangedEvents_Sys
EventMesh_Snck-Hnw_Kind-SalesOrder-CreatedEvents_Sys
EventMesh_Snck-Hnw_Kind-ProcessOrder-Changed-CreateEvents_Sys
EventMesh_Snck-Hnw_Kind-PostGoodsIssueEvents_Sys
EventMesh_Snck-Hnw_Kind-InboundDelivery-CreatedAndChangedEvents_Sys
EventMesh_Snck-Hnw_Kind-PurchaseOrder-CreatedEvents-Sender_Sys

## ReProX_Common_Sys (4 iFlows - Reprocessing Framework)
ReProX_Snck-Hnw_Common-Flow_Sys
ReProX_Snck-Hnw_Common-File-Handler_Prc
ReProX_Snck-Hnw_Reprocessing-to-IS_Prc
ReProX_Snck-Hnw_Common-API-Handler_Prc

## Other Systems
FedEx: Fedex_Snck-Hnw_LoadPlan-ManhattanScaleforReltioAndLemoyne_Prc, FedEx_Snck-Hnw_Kind-ShipNoticeManifest_Sys, Fedex_Snck-Hnw_LoadPlan-ManhattanScopeforNashville_Prc
UberFreight: UberFreight_Snck-Hnw_Common-UberFreight-PostGoodsIssue-Http_Sys, UberFreight_Snck-Hnw_Kind-APILoadPlan_Sys, UberFreight_Snck-Hnw_Kind-CarrierShipment_Sys, UberFreight_Snck-Hnw_Common-WarehouseShippingOrderForTransfers-Sftp_Sys
BankOfAmerica: BankOfAmerica_Snck-Hnw_Kind-BankStatement_Sys
Atlas_AEP: Atlas_AEP_Common_IDoc_Sys
DataSphere: Datasphere_Snck-Hnw_Global-MarketExchangeRates_Sys
PECO: Peco_Snck-Hnw_Common-PecoFile-Sftp_Sys
RedZone: S4hpc_Snck-Hnw_ProductionSchedule-to-RedZone_Prc
Valo: Valo_Snck-Hnw_Kind-InventoryQuantity_Sys, Valo_Snck-Hnw_Kind-ValoFileForSampleOrders_Sys
TradePro: TradePro_Snck-Hnw_Kind-Promotions-US_Sys, TradePro_Snck-Hnw_Kind-Promotions-CA_Sys, TradePro_Snck-Hnw_Kind-CheckRequest-US-CustomerPromotions_Sys, TradePro_Snck-Hnw_Kind-CheckRequest-CA-CustomerPromotions_Sys, TradePro_Snck-Hnw_Kind-TradeDeductionResolutionFile-US_Sys, TradePro_Snck-Hnw_Kind-TradeDeductionResolutionFile-CA_Sys, TradePro_Snck-Hnw_Common-SalesOrderInfo-Sftp_Sys
CommonObjects: Global common objects shared across packages

## ProcessDirect Adapter Linkages

ProcessDirect chains Sys iFlows to Prc iFlows without HTTP overhead.

### Confirmed Link (BlueYonder PurchaseOrders):
Sender: BlueYonder_Snck-Hnw_Kind-PurchaseOrders_Sys (SFTP Sender)
  Receiver ProcessDirect address: /Inbound/PurchaseOrders/Sftp_Send
  Target Prc iFlow: S4hpc_Snck-Hnw_PurchaseOrders_Prc
  Exception handler: /ExceptionFlow
  ReProX address: /reprox/common/file

### ProcessDirect Address Patterns:
/ExceptionFlow - Global exception handler (ALL iFlows)
/Inbound/{MessageType}/{Source} - Inbound to S4HPC
/BlueYonder/{MessageType}/{Direction} - BlueYonder specific
/reprox/common/file - ReProX reprocessing framework
/Sender_ProcessDirect - Dynamic (from message header)

## Standard iFlow Architecture

Sender System (SFTP/HTTP/OData/EventMesh)
  StartEvent
  Groovy: SetcurrTransactionID (from SC_Global_GroovyScripts bundle)
  Groovy: fetch_file_name
  Exclusive Gateway (route by business rule e.g. PO type, company code)
  Enricher: Set all standard headers and properties
    - C_InterfaceName, C_Workstream, C_BusinessUnit
    - SAP_Sender, SAP_Receiver, C_Sender_Flow
    - Environment, CompanyCode, C_File_Name
    - C_ReProXNeeded, C_ReProXProcessDir
    - MailSubject, MessageTo, MessageFrom, Platform
    - C_MM_Name, C_receiverAgency, C_senderAgency
  Groovy: Capture_Req_Headers
  ProcessDirect (Receiver) -> Prc iFlow
  EndEvent

Error SubProcess (ErrorEventSubProcessTemplate):
  ErrorStartEvent
  Process Call -> LocalIntegrationProcess
    Enricher (log error: flowName, errorType, correlationId,
              SAP_MessageProcessingLogID, Description, businessId)
    ProcessDirect -> /ExceptionFlow
  EndEvent

## External Configuration Parameters Template

SFTP_Address=<host>
SFTP_Directory=/inbox/<BusinessUnit>
SFTP_CredentialName=<BU>_<System>_SFTP_<Env>
SFTP_Authentication=user_password
SFTP_Post_Processing=move
SFTP_Archive_Directory=.archive
SFTP_Scheduler=<cron>
SFTP_Max_Message_Per_Poll=20
SFTP_Poll_on_One_Worker_Only=1
SFTP_Enable_Support_For_Deprecated_Algorithms=1
SFTP_MaximumReconnectAttempts=3
SFTP_LockTimeout=15
CompanyCode=1163
C_BusinessUnit=KIND SNACKS
C_Workstream=P2P
C_InterfaceName=<Interface Name>
C_Sender_Flow=<IFlow Name>
Environment=DEV
Reciever_Process_Dir=/Inbound/<MessageType>/Sftp_Send
Sender_ProcessDirect=/Inbound/<MessageType>/Sftp_Send
Global_Exception=/ExceptionFlow
C_ReProXNeeded=Yes
C_ReProXProcessDir=/reprox/common/file
Platform=BTP
MessageTo=btp.notifications@kindsnacks.com
MessageFrom=btp.notifications@kindsnacks.com
MailSubject=KIND SNACKS - BlueYonder to S4HPC - Purchase Orders
applicationName=<IFlow_Name>

## Groovy Patterns

### Value Mapping:
import com.sap.gateway.ip.core.customdev.util.Message
import com.sap.it.api.mapping.ValueMappingApi
import com.sap.it.api.ITApiFactory
def Message processData(Message message) {
    def valueMappingApi = ITApiFactory.getApi(ValueMappingApi.class, null)
    def companyCode = message.getProperties().get(CompanyCode)
    def mappedValue = valueMappingApi.getMappedValue(
        BlueYonder, CompanyCode, companyCode, S4HPC, MM_PurchaseOrder
    )
    message.setProperty(MappedCompanyCode, mappedValue ?: ")
    return message
}

### Set Transaction ID:
def Message processData(Message message) {
    def transactionId = UUID.randomUUID().toString()
    message.setHeader(SAP_MplCorrelationId, transactionId)
    message.setProperty(currTransactionID, transactionId)
    return message
}
