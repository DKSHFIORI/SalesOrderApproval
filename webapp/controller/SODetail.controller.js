sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/ui/core/routing/History",
	"sap/m/library",
	"sap/m/Dialog",
	"sap/m/DialogType",
	"sap/m/Label",
	"sap/m/TextArea",
	"sap/m/Button",
	"sap/m/MessageToast",
	"sap/m/MessagePopover",
	"sap/m/MessageItem",
	"sap/ui/core/Core",
], function (Controller,JSONModel,Fragment,History,mobileLibrary,Dialog,DialogType,Label,TextArea,Button,MessageToast,MessagePopover,MessageItem,Core) {
	"use strict";
	
	var i18nBundle = {};
	
	var lv_data = "";
	var dataToPass = "";
	return Controller.extend("ysd.wa.wrkflapp.YSD_WA_WRKFLAPP.controller.SODetail", 
	{
		gv_poststructure: [],
		gv_postRejectStructure: [],
		
		onInit: function () 
		{
			var t = this;
			t.detectSystemMobileDesktopView();
			this.i18nBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			
			this.getView().addEventDelegate({
				onBeforeHide: function(event){
					var targetView = event.to;
					
					//pass the data
					var datas = {
						"DataPass" : t.gv_search_value,
						"SalesOrder" : t.gv_search_SalesOrder,
						"MobileSelection" : t.gv_selection
					};
					dataToPass = datas;
					targetView.data("data", dataToPass);
					
				},
				onAfterShow: function(e)
				{
					lv_data = t.getView().data("data");
					if(lv_data === null)
					{
						if(t.gv_search_value && t.gv_search_value !== undefined)
						{
							var targetView = e.to;
							var datas = {
								"DataPass" : t.gv_search_value
							};
							dataToPass = datas;
							targetView.data("data", dataToPass);
							lv_data = t.getView().data("data");
						}
					}
					t.getView().byId("Reject").setEnabled(true);
					t.getView().byId("Approve").setEnabled(true);
					t.getView().byId("MoreInfo").setEnabled(true);
					t.oDataService();
				}
			}, this);
			
			var oRouter = this.getOwnerComponent().getRouter(); 
			oRouter.getRoute("SODetail").attachPatternMatched(this.routeMatched, this);
			oRouter.getRoute("SODetailEmail").attachPatternMatched(t.onObjectMatched, t);
		},

		onObjectMatched: function(oEvent)
		{
			var t = this;
			var Guid = oEvent.getParameter("arguments").Guid;
			
			//Encode the Guid
			//var Guid = atob(EncryptGuid);
			t.gv_search_value = Guid;
		},
		
		routeMatched: function(oEvent)
		{
			
		},
		
		oDataService: function ()
		{
			var t = this;
			var checkData = this.getView().data("data");
 			if(!checkData && checkData === null )
			{
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Dashboard", {
					detail:window.encodeURIComponent()
				});
			}
			else
			{
				var Guid = this.getView().data("data").DataPass;
				var busyDialog = t.showBusyDialog("Loading...");
				busyDialog.open();  
				// get dummy post structure
				this.getPostStructure();
				this.getPostRejectStructure();
				var SearchGuid = Guid;
				///sap/opu/odata/sap/YSD_SO_WORKFLOW_APPV_SRV/SoHdrSet('E41F1350D6C01EDCAEC8904E3A24135B')?$expand=SoHdrToItm&$format=json
	
				var oModel = t.getOwnerComponent().getModel("YSD_SO_WORKFLOW_APPV_SRV"); 
				var arrSearch = [];
				oModel.read("/SoHdrSet(Guid='"+SearchGuid+"')",{
					urlParameters: { 
						"$expand": "SoHdrToItm",
						"$format": "json" 
					}, 
					success:function(oResult)
					{
						busyDialog.close();
						if(oResult.IsApprover === "")
						{
							t.getView().byId("Reject").setEnabled(false);
							t.getView().byId("Approve").setEnabled(false);
						}
						
						arrSearch.push(oResult);
						
						t.displayMobileHeaderContent(arrSearch);
						t.displayDesktopHeaderContent(arrSearch);
						t.displayMobileTableContent(arrSearch);
						t.displayTableContent(arrSearch);
					},
					error : function (oResult)
					{
						busyDialog.close();
						var messageJson = JSON.parse(oResult.responseText);
						var errorDetails = messageJson.error.message.value;
						MessageToast.show("Error. " + errorDetails);
					}
				});
			}
		},
		
		getPostStructure: function()
		{
			var t = this;
			var oModel = t.getOwnerComponent().getModel("YSD_SO_WORKFLOW_APPV_SRV"); 
			oModel.read("/SoEmailSet('DUMMY')",{
				urlParameters: { 
					"$format": "json" 
				}, 
				success:function(oResult)
				{
					t.gv_poststructure = oResult;
				},
				error : function (oResult)
				{
					var messageJson = JSON.parse(oResult.responseText);
					var errorDetails = messageJson.error.message.value;
					MessageToast.show("Error. " + errorDetails);
				}
			});
		},
		
		getPostRejectStructure: function(){
			var t = this;
			var oModel = t.getOwnerComponent().getModel("YSD_SO_WORKFLOW_APPV_SRV"); 
			oModel.read("/SoRejectionSet('DUMMY')",{
				urlParameters: { 
					"$format": "json" 
				}, 
				success:function(oResult)
				{
					t.gv_postRejectStructure = oResult;
				},
				error : function (oResult)
				{
					var messageJson = JSON.parse(oResult.responseText);
					var errorDetails = messageJson.error.message.value;
					MessageToast.show("Error. " + errorDetails);
				}
			});
		},
		displayMobileHeaderContent: function(arrData){
			var t = this;
			var PONumber = t.i18nBundle.getText("PO");
			var ReqDD = t.i18nBundle.getText("RequiredDD");
			
			t.getView().byId("DetailHeader").setObjectTitle(arrData[0].SalesOrder);
			t.getView().byId("DetailHeader").setObjectSubtitle(arrData[0].SoCreator + " (" + this.DateFormat().format(arrData[0].RequiredDelivDate) + ")" );
			t.getView().byId("MobileSalesArea").setText(arrData[0].SalesArea + " - " + arrData[0].SalesEmployee);
			t.getView().byId("MobileCustomerName").setText(arrData[0].CustomerName + " (" + arrData[0].CustomerCode + ")");
			t.getView().byId("MobilePO").setText(PONumber + " " + arrData[0].PurchaseOrder);
			t.getView().byId("MobileRequiredDeliveryDate").setText(ReqDD + " " + this.DateFormat().format(arrData[0].RequiredDelivDate));
			t.getView().byId("MobileDocumentCurrency").setText(arrData[0].TotAmtCurrency);	//Begin of D00K9F5AQ4
			t.getView().byId("MobileTotalAmtExclVAT").setText(arrData[0].TotalAmountExVatFormatted);	//Begin of D00K9F5AQ4
			t.getView().byId("MobileVAT").setText(arrData[0].VatAmtFormatted);							//Begin of D00K9F5AQ4
			t.getView().byId("MobileTotalAmtInclVAT").setText(arrData[0].TotalAmountInVatFormatted);	//Begin of D00K9F5AQ4
			t.getView().byId("MobileGM1Perc").setText(arrData[0].Gm1Percent);

		},
		
		displayDesktopHeaderContent: function(arrData){
			//<<Start of C001 (READ.md)
			let orderTypeGM, sPath, vFirstDate;
			//End of C001
			var t = this;
			
			t.getView().byId("SalesOrganization").setText(arrData[0].SalesOrganization);
			t.getView().byId("SalesEmployee").setText(arrData[0].SalesEmployee);
			t.getView().byId("Division").setText(arrData[0].Division);
			t.getView().byId("OrderType").setText(arrData[0].OrderType);
			t.getView().byId("SOCreator").setText(arrData[0].SoCreator);
			t.getView().byId("SalesArea").setText(arrData[0].SalesArea);
			
			arrData.SoDateDisplay = this.DateFormat().format(arrData[0].SoDate);
			t.getView().byId("SODate").setText(arrData.SoDateDisplay);
			t.getView().byId("RequiredDeliveryDate").setText(this.DateFormat().format(arrData[0].RequiredDelivDate));
			t.getView().byId("SONumber").setText(arrData[0].SalesOrder);
			t.getView().byId("TotalAmountExclVAT").setText(arrData[0].TotalAmountExVatFormatted);   	//Begin of D00K9F5AQ4
			t.getView().byId("DocumentCurrency").setText(arrData[0].TotAmtCurrency);
			t.getView().byId("CustomerCode").setText(arrData[0].CustomerCode);
			t.getView().byId("VAT").setText(arrData[0].VatAmtFormatted);						   		//Begin of D00K9F5AQ4
			t.getView().byId("CustomerName").setText(arrData[0].CustomerName);
			t.getView().byId("TotalAmountInclVAT").setText(arrData[0].TotalAmountInVatFormatted);		//Begin of D00K9F5AQ4
			t.getView().byId("PONumber").setText(arrData[0].PurchaseOrder);
			t.getView().byId("GM1Perc").setText(arrData[0].Gm1Percent);
			//<<Start of C001 (READ.md)
			t.getView().byId("idIncotermsText").setText(arrData[0].Incoterms);
			t.getView().byId("idIncotermsLocText").setText(arrData[0].IncotermsLoc1);
			t.getView().byId("idPaymentTermText").setText(arrData[0].PaymentTerm);
			t.getView().byId("idRemarksTextArea").setValue(arrData[0].Remarks);
			//Update Format of First date
			// vFirstDate = t.getOwnerComponent().getModel().setProperty("/FirstDate", )

			// this.DateFormat().format(arrData[0].RequiredDelivDate)
			

			orderTypeGM = this.getOwnerComponent().getModel("uiModel"); 

			//Update Column Header
			if (orderTypeGM) {
				try{
					let checkType = orderTypeGM.getProperty("/GMText/" + arrData[0].OrderType.toString());
					if(!checkType){
						orderTypeGM = orderTypeGM.getProperty("/GMText/DEFAULT");
					}
					this.getOwnerComponent().getModel("uiModel").setProperty("/GM1Label", orderTypeGM.GM1);
					this.getOwnerComponent().getModel("uiModel").setProperty("/GM1PLabel", orderTypeGM.GM1_P);
				}catch(error){
					console.log(error);
				}
			}
			//End of C001
		},
		displayMobileTableContent: function(arrData){
			var oTable = this.getView().byId("Mobile_MaterialTable");
			var oItem = new JSONModel();
			oItem.setSizeLimit(arrData[0].SoHdrToItm.results.length);
			oItem.setData(arrData[0].SoHdrToItm.results);
			oTable.setModel(oItem);
		},
		displayTableContent: function(arrData)
		{
			var oTable = this.getView().byId("Material_table");
			var oItem = new JSONModel();
			oItem.setSizeLimit(arrData[0].SoHdrToItm.results.length);
			oItem.setData(arrData[0].SoHdrToItm.results);
			oTable.setModel(oItem);
		},
		detectSystemMobileDesktopView: function(){
			
			var desktopViewTable1,desktopViewTable2,MobileView;
			//  detect mobile or not
			if (sap.ui.Device.system.phone === true)
			{
				desktopViewTable1 = this.getView().byId("DesktopHeaderDetail");
				desktopViewTable1.setVisible(false);
				
				desktopViewTable2 = this.getView().byId("DesktopTableDetail");
				desktopViewTable2.setVisible(false);
				
				MobileView = this.getView().byId("MobileDetailPage");
				MobileView.setVisible(true);
			}
			else
			{
				desktopViewTable1 = this.getView().byId("DesktopHeaderDetail");
				desktopViewTable1.setVisible(true);
				
				desktopViewTable2 = this.getView().byId("DesktopTableDetail");
				desktopViewTable2.setVisible(true);
				
				MobileView = this.getView().byId("MobileDetailPage");
				MobileView.setVisible(false);
			}
		},
		SendEmail: function(){
			var t = this;
			
			/*lv_data = t.getView().data("data");
			var SOTitle = lv_data.SalesOrder;*/
			
			var SOTitle = t.getView().byId("SONumber").getText();
			
			var SubmitDecision = t.i18nBundle.getText("SubmitDecision");
			var DecisionNote = t.i18nBundle.getText("DecisionNote", [SOTitle]);
			var Cancel = t.i18nBundle.getText("Cancel");
			var SendEmail = t.i18nBundle.getText("SendEmail");
			var AddNotes = t.i18nBundle.getText("AddNotes");
			
			if (!this.oSubmitDialog) {
				this.oSubmitDialog = new Dialog({
					type: DialogType.Message,
					title: SubmitDecision,
					content: [
						new Label({
							text: DecisionNote,
							labelFor: "decisionNote"
						}),
						new TextArea("textAreaNotes", {
							width: "100%",
							placeholder: AddNotes,
							liveChange: function (oEvent) {
								var sText = oEvent.getParameter("value");
								this.oSubmitDialog.getBeginButton().setEnabled(sText.trim().length > 0);
							}.bind(this)
						})
					],
					beginButton: new Button({
						type: sap.m.ButtonType.Emphasized,
						text: SendEmail,
						enabled: false,
						press: function () 
						{
							t.onSendEmailPost(DecisionNote);
							sap.ui.getCore().byId("textAreaNotes").setValue("");
							this.oSubmitDialog.close();
						}.bind(this)
					}),
					endButton: new Button({
						text: Cancel,
						type: sap.m.ButtonType.Reject,
						press: function () {
							sap.ui.getCore().byId("textAreaNotes").setValue("");
							this.oSubmitDialog.close();
						}.bind(this)
					})
				});
			}
			this.oSubmitDialog.open();
			
		},
		
		onSendEmailPost: function(DecisionNote)
		{
			var t = this;
			
			var busyDialog = t.showBusyDialog("Loading...");
			busyDialog.open();  
			var emailCOntent = sap.ui.getCore().byId("textAreaNotes").getValue();
			delete this.gv_poststructure.__metadata;
			
			t.gv_poststructure.SalesOrder = lv_data.SalesOrder;
			t.gv_poststructure.Guid = lv_data.DataPass;
			t.gv_poststructure.Title = DecisionNote;
			t.gv_poststructure.Content = emailCOntent;
			
			// refer: /sap/opu/odata/sap/YSD_SO_WORKFLOW_APPV_SRV/SoEmailSet('DUMMY')?$format=json
			
			var arrpost = t.gv_poststructure;
			
			var oModel = t.getOwnerComponent().getModel("YSD_SO_WORKFLOW_APPV_SRV"); 
			
			oModel.create("/SoEmailSet", arrpost,{
				success:function(oResult)
				{
					busyDialog.close();
					MessageToast.show(oResult.Message);
				},
				error : function (oResult)
				{
					busyDialog.close();
					t.createErrorMessage(oResult);
				}
			});
		},
		
		onNavBack: function(){
			
			var t = this;
			
			t.gv_selection = lv_data.MobileSelection;
			t.gv_search_value = lv_data.DataPass;
			
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if(sPreviousHash !== undefined){
				window.history.go(-1);
			}else{
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("Dashboard",{},true);
				
			}
		},
		PressReject: function(){
			
			var t = this;
			var RejectSalesOrder = t.i18nBundle.getText("RejectSalesOrder");
			var RejectionReason = t.i18nBundle.getText("RejectionReason");
			var RejectReasonPlaceHolder = t.i18nBundle.getText("RejectReasonPlaceHolder");
			var Submit = t.i18nBundle.getText("Submit");
			var Cancel = t.i18nBundle.getText("Cancel");
			if (!this.oRejectDialog) {
				this.oRejectDialog = new Dialog({
					type: DialogType.Message,
					title: RejectSalesOrder,
					content: [
						new Label({
							text: RejectionReason,
							labelFor: "submissionNote"
						}),
						new TextArea("RejectTextArea", {
							width: "100%",
							placeholder: RejectReasonPlaceHolder,
							liveChange: function (oEvent) {
								var sText = oEvent.getParameter("value");
								this.oRejectDialog.getBeginButton().setEnabled(sText.trim().length > 0);
							}.bind(this)
						})
					],
					beginButton: new Button({
						type: sap.m.ButtonType.Emphasized,
						text: Submit,
						enabled: false,
						press: function () {
							t.onSendReject(RejectionReason);
							sap.ui.getCore().byId("RejectTextArea").setValue("");
							this.oRejectDialog.close();
						}.bind(this)
					}),
					endButton: new Button({
						text: Cancel,
						type: sap.m.ButtonType.Reject,
						press: function () {
							sap.ui.getCore().byId("RejectTextArea").setValue("");
							this.oRejectDialog.close();
						}.bind(this)
					})
				});
			}

			this.oRejectDialog.open();
		},
		onSendReject : function(RejectionReason){
			var t = this;
			
			var busyDialog = t.showBusyDialog("Loading...");
			busyDialog.open();  
			
			var rejectContent = sap.ui.getCore().byId("RejectTextArea").getValue();
			delete this.gv_poststructure.__metadata;
			
			t.gv_poststructure.SalesOrder = lv_data.SalesOrder;
			t.gv_poststructure.Guid = lv_data.DataPass;
			t.gv_poststructure.Title = RejectionReason;
			t.gv_poststructure.Content = rejectContent;
			
			// refer: /sap/opu/odata/sap/YSD_SO_WORKFLOW_APPV_SRV/SoRejectionSet('DUMMY')?$format=json

			var arrpost = t.gv_poststructure;
			var oModel = t.getOwnerComponent().getModel("YSD_SO_WORKFLOW_APPV_SRV"); 
			
			oModel.create("/SoRejectionSet", arrpost,{

				success:function(oResult)
				{
					busyDialog.close();
					t.getView().byId("Reject").setEnabled(false);
					t.getView().byId("Approve").setEnabled(false);
					t.getView().byId("MoreInfo").setEnabled(false);
					MessageToast.show(oResult.Message);
				},
				error : function (oResult)
				{
					// busy close
					t.createErrorMessage(oResult);
					busyDialog.close();
				}
			});
		},
		PressApprove: function(){
			var t = this;
			
			var Guid = lv_data.DataPass;
			
			var busyDialog = t.showBusyDialog("Loading...");
			busyDialog.open();  
			// refer: /sap/opu/odata/sap/YSD_SO_WORKFLOW_APPV_SRV/ApproveSo?Guid='E41F1350D6C01EDCAEC8904E3A24135B'&$format=json
			
			var oModel = t.getOwnerComponent().getModel("YSD_SO_WORKFLOW_APPV_SRV"); 
			
			var emparray = [];
			oModel.create("/ApproveSo" , emparray,{   // "/ApproveSo?Guid='" + Guid + "'"
				 urlParameters: { 
				 	"Guid": "'" + Guid + "'"
				 	// "$format": "json" 
				 }, 
				success:function(oResult)
				{
					busyDialog.close();
					t.getView().byId("Reject").setEnabled(false);
					t.getView().byId("Approve").setEnabled(false);
					t.getView().byId("MoreInfo").setEnabled(false);
					MessageToast.show(oResult.Message);
				},
				error : function (oResult)
				{
					t.createErrorMessage(oResult);
			
					busyDialog.close();

				}
			});
		},
		createErrorMessage: function(oResult)
		{
			var t = this;
			
			// Handle MessageView Error
			var messageJson = JSON.parse(oResult.responseText);
			var errorDetails = messageJson.error.innererror.errordetails;
			
			var lv_msg = messageJson.error.message.value;
			var arrayMessage = [];
			if(lv_msg !== "")
			{
				for (var a = 0; a < errorDetails.length; a++)
				{
					if(errorDetails[a].message !== lv_msg)
					{
						arrayMessage.push(errorDetails[a]);
					}
				}
			}
			t._generateMessageView(arrayMessage);
		},
		DateFormat: function()
		{
			var lv_pattern = "dd.MM.yyyy";
			return sap.ui.core.format.DateFormat.getDateTimeInstance({pattern: lv_pattern});
		},
		showBusyDialog: function() 
		{
			return new sap.m.BusyDialog({});
		},
		
		// Message View Error
		_generateMessageView: function(errorDetails)
		{
			var t = this;
			
			for(var x in errorDetails){
				if(errorDetails[x].severity === "error"){
					errorDetails[x].type = "Error";
				}
				else if(errorDetails[x].severity === "success"){
					errorDetails[x].type = "Success";
				}
				else if(errorDetails[x].severity === "info"){
					errorDetails[x].type = "Information";
				}
				else if(errorDetails[x].severity === "warning"){
					errorDetails[x].type = "Warning";
				}
			}
			
			var JSONModel = new sap.ui.model.json.JSONModel();   
			JSONModel.setSizeLimit(errorDetails.length);
			JSONModel.setData(errorDetails);
			
			var oMessageTemplate = new sap.m.MessageItem({
				type: '{type}',
				title: '{message}'
			});
			
			var oBackButton = new sap.m.Button({
				icon: sap.ui.core.IconPool.getIconURI("nav-back"),
				visible: false,
				press: function () {
					t.oMessageView.navigateBack();
					this.setVisible(false);
				}
			});
			
			t.oMessageView = new sap.m.MessageView({
				showDetailsPageHeader: false,
				itemSelect: function () {
					oBackButton.setVisible(true);
				},
				items: {
					path: "/",
					template: oMessageTemplate
				}
			});
			
			t.oMessageView.setModel(JSONModel);
			
			// Check device
			var isPhone = false;
			if (sap.ui.Device.system.phone === true)
			{
				isPhone = true;
			}
			
			t.oDialog = new sap.m.Dialog({
				resizable: true,
				content: t.oMessageView,
				state: 'Error',
				beginButton: new sap.m.Button({
					type: sap.m.ButtonType.Unstyled,
					press: function () {
						this.getParent().close();
					},
					text: "Close"
				}),
				customHeader: new sap.m.Bar({
					contentMiddle: [
						new sap.m.Text({ text: "Error"})
					],
					contentLeft: [oBackButton]
				}),
				contentHeight: "300px",
				contentWidth: "500px",
				verticalScrolling: false,
				stretch: isPhone
			});
			
			t.oDialog.open();
		}
		
	});
});











