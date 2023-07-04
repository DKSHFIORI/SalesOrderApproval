sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Filter",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (Controller,JSONModel,FilterOperator,Filter,MessageBox,MessageToast) {
	"use strict";
	
	var gridPendingApproval,gridPendingOthers,gridCompleted,gridRejected;
	var pendingTable,pendingOtherTable,completeTable,rejectedTable;
	var PanelTableTitle;
	var i18nBundle = {};
	var totalApproval,totalPending,totalCompleted,totalRejected;
	var lv_data;
	
	return Controller.extend("ysd.wa.wrkflapp.YSD_WA_WRKFLAPP.controller.Dashboard", {
		onInit: function(){
			var t = this;
			this.i18nBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			PanelTableTitle = this.getView().byId("TableTitle");
			var busyDialog = this.showBusyDialog("Loading...");
			busyDialog.open();
			
			totalApproval = 0;
			totalPending = 0;
			totalCompleted = 0;
			totalRejected = 0;
			
			this.getView().addEventDelegate({
				onBeforeHide: function(event) {
					
					var targetView = event.to;
					
					// pass the data 
					var dataToPass = { 
						"DataPass" : t.gv_search_value,
						"SalesOrder" : t.gv_search_SalesOrder,
						"MobileSelection": t.gv_selection
					};
					targetView.data("data", dataToPass);
				},
				onAfterShow: function (e) {
					//t.oDataService();
					lv_data = t.getView().data("data");
				}
			}, this);
			this.InitialTable();
			this.TriggerEachGridWhenClick();
				
			var oRouter = this.getOwnerComponent().getRouter(); 
			oRouter.getRoute("Dashboard").attachPatternMatched(this._patternMatched, this);
			
			setTimeout(function () {
				busyDialog.close();
			}, 1000);
			
		},
		
		_patternMatched: function(){
			this.oDataService();
		},
		oDataService: function()
		{
			var t = this;
			
			var PendingApproval = t.i18nBundle.getText("PENDA");
			var PendingOthers = t.i18nBundle.getText("PENDO");
			var Completed = t.i18nBundle.getText("COMPT");
			var Rejected = t.i18nBundle.getText("REJET");

			t.SetupButtonCount(PendingApproval);
			t.SetupButtonCount(PendingOthers);
			t.SetupButtonCount(Completed);
			t.SetupButtonCount(Rejected);
			
				if(!t.gv_selection)
				{
					t.SetupODataServices(PendingApproval);
				}
				else
				{
					t.SetupODataServices(t.gv_selection);
				}

				if(sap.ui.Device.system.phone === true)
				{
					if(t.gv_selection === "Pending Approval")
					{
						t.SetupMobileODataServices(PendingApproval);
					}
					else if (t.gv_selection === "Pending Others")
					{
						t.SetupMobileODataServices(PendingOthers);
					}
					else if (t.gv_selection === "Completed")
					{
						t.SetupMobileODataServices(Completed);
					}
					else if (t.gv_selection === "Rejected")
					{
						t.SetupMobileODataServices(Rejected);
					}
					//undefined when initial the page
					else
					{
						t.SetupMobileODataServices(PendingApproval);
					}
				}
		},
		
		SetupButtonCount: function(status)
		{
			var t = this;
			var oModelMaterial = t.getOwnerComponent().getModel("YSD_SO_WORKFLOW_APPV_SRV");
			var busyDialog = t.showBusyDialog("Loading...");
			busyDialog.open();
			
			
			//refer: /sap/opu/odata/sap/YSD_SO_WORKFLOW_APPV_SRV/SoListSet/$count?$filter=SelectStatus eq 'PENDA'
			oModelMaterial.read("/SoListSet/$count", {   // ?$filter=SelectStatus='" + status + "'"
				
				// filter: vFilter,
				urlParameters: {
					//"$count",
					"$filter": "SelectStatus eq '"+ status +"'", 
					//"$format": "json" 
				}, 
				success: function(oResult)
				{
					busyDialog.close();

					if(status === "PENDA")
					{
						totalApproval = oResult;
						t.getView().byId("PendingApprovalHeader").setText(oResult);
						t.mobileDropdownSelection();
					}
					else if (status === "PENDO")
					{
						totalPending = oResult;
						t.getView().byId("PendingOthersHeader").setText(oResult);
						t.mobileDropdownSelection();
					}
					else if (status === "COMPT" )
					{
						totalCompleted = oResult;
						t.getView().byId("CompletedHeader").setText(oResult);
						t.mobileDropdownSelection();
					}
					else if (status === "REJET")
					{
						totalRejected = oResult;
						t.getView().byId("RejectedHeader").setText(oResult);
						t.mobileDropdownSelection();
					}
					
				},
				error: function(oResult)
				{
					
				}
			});
		},
		SetupODataServices: function(status)
		{
			var t = this;
			var oModelMaterial = t.getOwnerComponent().getModel("YSD_SO_WORKFLOW_APPV_SRV");
			
			var busyDialog = t.showBusyDialog("Loading...");
			busyDialog.open();
			/*var vFilter = [
					new sap.ui.model.Filter("SelectStatus", sap.ui.model.FilterOperator.EQ, status)			
			];*/
			
			//refer: /sap/opu/odata/sap/YSD_SO_WORKFLOW_APPV_SRV/SoListSet?$filter=SelectStatus eq 'PENDA'&$format=json
			
			var arrSearch = [];
			oModelMaterial.read("/SoListSet", {   // ?$filter=SelectStatus='" + status + "'"
				// filter: vFilter,
				urlParameters: { 
					"$filter": "SelectStatus eq '"+ status +"'", 
					"$format": "json" 
				}, 
				success: function(oResult){
					var result= oResult.results;
					busyDialog.close();
					/*
					if(lv_data !== null && lv_data !== undefined && lv_data !== '')
					{
						if(lv_data.MobileSelection !== null && lv_data.MobileSelection !== undefined && lv_data.MobileSelection !== ''){
							var selection = lv_data.MobileSelection;
						}
					}*/
					
					if(status === "PENDA")
					{
						for(var i = 0; i < result.length; i++)
						{
							arrSearch.push(result[i]);
						}
						t.oBindingTableData(arrSearch,status);
						//t.oBindingMobileData(arrSearch,status,selection);
					}
					else if (status === "PENDO")
					{
						for(i = 0; i < result.length; i++)
						{
							arrSearch.push(result[i]);
						}
						t.oBindingTableData(arrSearch,status);
						//t.oBindingMobileData(arrSearch,status,selection);
					}
					else if (status === "COMPT")
					{
						for(i = 0; i < result.length; i++)
						{
							arrSearch.push(result[i]);
						}
						t.oBindingTableData(arrSearch,status);
						//t.oBindingMobileData(arrSearch,status,selection);
					}
					else if (status === "REJET")
					{
						for(i = 0; i < result.length; i++)
						{
							arrSearch.push(result[i]);
						}
						t.oBindingTableData(arrSearch,status);
					//	t.oBindingMobileData(arrSearch,status,selection);
					}
				},
				error: function(oResult)
				{
					var messageJson = JSON.parse(oResult.responseText);
					var errorDetails = messageJson.error.message.value;
					MessageToast.show("Error. " + errorDetails);
					busyDialog.close();
				}
			});
		},
		
		SetupMobileODataServicesWithoutChange: function(status)
		{
			var t = this;
			var oModelMaterial = t.getOwnerComponent().getModel("YSD_SO_WORKFLOW_APPV_SRV");
			
			var busyDialog = t.showBusyDialog("Loading...");
			busyDialog.open();
			/*var vFilter = [
					new sap.ui.model.Filter("SelectStatus", sap.ui.model.FilterOperator.EQ, status)			
			];*/
			
			//refer: /sap/opu/odata/sap/YSD_SO_WORKFLOW_APPV_SRV/SoListSet?$filter=SelectStatus eq 'PENDA'&$format=json
			
			var arrSearch = [];
			oModelMaterial.read("/SoListSet", {   // ?$filter=SelectStatus='" + status + "'"
				// filter: vFilter,
				urlParameters: { 
					"$filter": "SelectStatus eq '"+ status +"'", 
					"$format": "json" 
				}, 
				success: function(oResult){
					var result= oResult.results;
					busyDialog.close();
					
					if(status === "PENDA")
					{
						for(var i = 0; i < result.length; i++)
						{
							arrSearch.push(result[i]);
						}
						t.oBindingMobileDataSelection(arrSearch,status);
					}
					else if (status === "PENDO")
					{
						for(i = 0; i < result.length; i++)
						{
							arrSearch.push(result[i]);
						}
						t.oBindingMobileDataSelection(arrSearch,status);
					}
					else if (status === "COMPT")
					{
						for(i = 0; i < result.length; i++)
						{
							arrSearch.push(result[i]);
						}
						t.oBindingMobileDataSelection(arrSearch,status);
					}
					else if (status === "REJET")
					{
						for(i = 0; i < result.length; i++)
						{
							arrSearch.push(result[i]);
						}
						t.oBindingMobileDataSelection(arrSearch,status);
					}
				},
				error: function(oResult)
				{
					var messageJson = JSON.parse(oResult.responseText);
					var errorDetails = messageJson.error.message.value;
					MessageToast.show("Error. " + errorDetails);
					busyDialog.close();
				}
			});
		},
		
		SetupMobileODataServices: function(status)
		{
			var t = this;
			var oModelMaterial = t.getOwnerComponent().getModel("YSD_SO_WORKFLOW_APPV_SRV");
			
			var busyDialog = t.showBusyDialog("Loading...");
			busyDialog.open();
			/*var vFilter = [
					new sap.ui.model.Filter("SelectStatus", sap.ui.model.FilterOperator.EQ, status)			
			];*/
			
			//refer: /sap/opu/odata/sap/YSD_SO_WORKFLOW_APPV_SRV/SoListSet?$filter=SelectStatus eq 'PENDA'&$format=json
			
			var arrSearch = [];
			oModelMaterial.read("/SoListSet", {   // ?$filter=SelectStatus='" + status + "'"
				// filter: vFilter,
				urlParameters: { 
					"$filter": "SelectStatus eq '"+ status +"'", 
					"$format": "json" 
				}, 
				success: function(oResult){
					var result= oResult.results;
					busyDialog.close();
					
					if(lv_data !== null && lv_data !== undefined && lv_data !== '')
					{
						if(lv_data.MobileSelection !== null && lv_data.MobileSelection !== undefined && lv_data.MobileSelection !== ''){
							var selection = lv_data.MobileSelection;
						}
					}
					if(status === "PENDA")
					{
						for(var i = 0; i < result.length; i++)
						{
							arrSearch.push(result[i]);
						}
						t.oBindingMobileData(arrSearch,status,selection);
					}
					else if (status === "PENDO")
					{
						for(i = 0; i < result.length; i++)
						{
							arrSearch.push(result[i]);
						}
						t.oBindingMobileData(arrSearch,status,selection);
					}
					else if (status === "COMPT")
					{
						for(i = 0; i < result.length; i++)
						{
							arrSearch.push(result[i]);
						}
						t.oBindingMobileData(arrSearch,status,selection);
					}
					else if (status === "REJET")
					{
						for(i = 0; i < result.length; i++)
						{
							arrSearch.push(result[i]);
						}
						t.oBindingMobileData(arrSearch,status,selection);
					}
					else
					{
						for(i = 0; i < result.length; i++)
						{
							arrSearch.push(result[i]);
						}
						t.oBindingMobileData(arrSearch,status,selection);
						//t.mobileDropdownSelection(selection);
					}
				},
				error: function(oResult)
				{
					var messageJson = JSON.parse(oResult.responseText);
					var errorDetails = messageJson.error.message.value;
					MessageToast.show("Error. " + errorDetails);
					busyDialog.close();
				}
			});
		},
		
		oBindingTableData: function(arrData, status)
		{
			for( var m=0; m<arrData.length; m++ )
			{
				arrData[m].SoCreatedDate_DISPLAY = this.DateFormat().format(arrData[m].SoCreatedDate);
			}
		
			var t = this;
			var oList;
			
			
			oList = t.getView().byId('SalesOrderTable');
			var oitemnvc = new sap.ui.model.json.JSONModel();
			oitemnvc.setSizeLimit(arrData.length);
			oitemnvc.setData(arrData);
			oList.setModel(oitemnvc);
		},
		
		oBindingMobileData: function(arrData, status,Dropdowselection)
		{
			var t = this;
			var oList;
			for( var m=0; m<arrData.length; m++ )
			{
				arrData[m].SoCreatedDate_DISPLAY = this.DateFormat().format(arrData[m].SoCreatedDate);
			}
			
			oList = t.getView().byId('MobileSOTable');
			var oitemnvc = new sap.ui.model.json.JSONModel();
			oitemnvc.setSizeLimit(arrData.length);
			oitemnvc.setData(arrData);
			oList.setModel(oitemnvc);
			t.mobileDropdownSelection(Dropdowselection);
		},
		
		oBindingMobileDataSelection: function(arrData, status)
		{
		
			var t = this;
			var oList;
			for( var m=0; m<arrData.length; m++ )
			{
				arrData[m].SoCreatedDate_DISPLAY = this.DateFormat().format(arrData[m].SoCreatedDate);
			}
			oList = t.getView().byId('MobileSOTable');
			var oitemnvc = new sap.ui.model.json.JSONModel();
			oitemnvc.setSizeLimit(arrData.length);
			oitemnvc.setData(arrData);
			oList.setModel(oitemnvc);
		},
		
		mobileDropdownSelection: function(dropdownSelection){
			var t = this;
			var PendingApproval = t.i18nBundle.getText("PendingApprovalSelection");
			var PendingOthers = t.i18nBundle.getText("PendingOtherSelection");
			var Completed = t.i18nBundle.getText("CompletedSelection");
			var Rejected = t.i18nBundle.getText("RejectedSelection");
			
			var defaultSelection; 
			if((dropdownSelection !== 'undefined' && dropdownSelection !== undefined) && dropdownSelection !== 'null' && dropdownSelection !== ''){
				defaultSelection = dropdownSelection;
			}
			else
			{
				defaultSelection = PendingApproval;
			}
			
				var oData = {
				"DefaultSelection": defaultSelection,
				"Selection": [
					{
						"Id": PendingApproval,
						"Name": PendingApproval,
						"Icon": "sap-icon://message-warning",
						"additionalText": totalApproval,
						"Value": PendingApproval
					},
					{
						"Id": PendingOthers,
						"Name": PendingOthers,
						"Icon": "sap-icon://paper-plane",
						"additionalText": totalPending,
						"Value": PendingOthers
					},
					{
						"Id": Completed,
						"Name": Completed,
						"Icon": "sap-icon://complete",
						"additionalText": totalCompleted,
						"Value": Completed
					},
					{
						"Id": Rejected,
						"Name": Rejected,
						"Icon": "sap-icon://cancel",
						"additionalText": totalRejected,
						"Value": Rejected
					}
				]
			};

			var oModel = new JSONModel(oData);
			this.getView().setModel(oModel);	
		},
		InitialTable: function(){
			//Grid View Table (button)
			gridPendingApproval = this.getView().byId("GridListPendingApproval");
			gridPendingOthers = this.getView().byId("GridListPendingOthers");
			gridCompleted = this.getView().byId("GridListCompleted");
			gridRejected = this.getView().byId("GridListRejected");
			
			//Table for each
			/*pendingTable = this.getView().byId("PendingApprovalTable");
			pendingOtherTable = this.getView().byId("PendingOtherTable");
			completeTable = this.getView().byId("CompleteTable");
			rejectedTable = this.getView().byId("RejectedTable");*/
			
			PanelTableTitle.setText("Pending Approval");
		},
		
		TriggerEachGridWhenClick: function(){
			var t = this;
			
			var PendingApproval = t.i18nBundle.getText("PENDA");
			var PendingOthers = t.i18nBundle.getText("PENDO");
			var Completed = t.i18nBundle.getText("COMPT");
			var Rejected = t.i18nBundle.getText("REJET");
			
			//Grid Pending Approval
			gridPendingApproval.attachBrowserEvent("click", function(event) {
			    PanelTableTitle.setText("Pending Approval");
				t.SetupODataServices(PendingApproval); 
				t.gv_selection = PendingApproval;
			}, this);
			
			//Grid Pending Others
			gridPendingOthers.attachBrowserEvent("click", function(event) {
			    PanelTableTitle.setText("Pending Others");
				t.SetupODataServices(PendingOthers); 
				t.gv_selection = PendingOthers;
			}, this);
			
			//Grid Completed
			gridCompleted.attachBrowserEvent("click", function(event) {
			   PanelTableTitle.setText("Completed");
				t.SetupODataServices(Completed); 
				t.gv_selection = Completed;
			}, this);
			
			//Grid Rejected
			gridRejected.attachBrowserEvent("click", function(event) {
				PanelTableTitle.setText("Rejected");
				t.SetupODataServices(Rejected);
				t.gv_selection = Rejected;
			}, this);
		},
		onPressNavigation : function(oEvent){
			var t = this;
			
			var SalesOrderTableCells = oEvent.getSource().getCells()[1].getText();
			var Guid = oEvent.getSource().getCells()[7].getText();
			t.gv_search_value = Guid;
			t.gv_search_SalesOrder = SalesOrderTableCells;
			
			
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("SODetail", {
				detail:window.encodeURIComponent()
			});
		},
		
		onListPressNavigation: function(oEvent){
			var t = this;
			
			var salesOrder = oEvent.getSource().getTitle();

			var Guid = oEvent.getSource().getBindingContext().getObject().Guid;

			t.gv_search_value = Guid;
			t.gv_search_SalesOrder = salesOrder;
			
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("SODetail", {
				detail:window.encodeURIComponent()
			});
		},
		
		onFilterSOnCustomer: function(oEvent){
			
			var Input = oEvent.getParameter("query").trim();
			var aFilter = [];
			var oTable, oBinding;
			if(Input)
			{
				var selectFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("SalesOrder", sap.ui.model.FilterOperator.Contains, Input),
						new sap.ui.model.Filter("CustomerName", sap.ui.model.FilterOperator.Contains, Input),
						new sap.ui.model.Filter("SoCreatedDate_DISPLAY", sap.ui.model.FilterOperator.Contains, Input),
						new sap.ui.model.Filter("CustomerCode", sap.ui.model.FilterOperator.Contains, Input),
						new sap.ui.model.Filter("TotalAmountExVat", sap.ui.model.FilterOperator.Contains, Input),
						new sap.ui.model.Filter("Gm1", sap.ui.model.FilterOperator.Contains, Input),
						new sap.ui.model.Filter("Gm1Percent", sap.ui.model.FilterOperator.Contains, Input)
					],
					and: false
				});
				aFilter.push(selectFilter);
				oTable = this.getView().byId("SalesOrderTable");
				oBinding = oTable.getBinding("items");
				oBinding.filter(aFilter);
			}
			else
			{
				oTable = this.getView().byId("SalesOrderTable");
				oBinding = oTable.getBinding("items");
				oBinding.filter(aFilter);
			}
		},
		
		onFilterSOnCustomerONMobile: function(oEvent){
			
			var Input = oEvent.getParameter("query").trim();
			var aFilter = [];
			var oTable, oBinding;
			if(Input)
			{
				var selectFilter = new sap.ui.model.Filter({
					filters: [
						new sap.ui.model.Filter("SalesOrder", sap.ui.model.FilterOperator.Contains, Input),
						new sap.ui.model.Filter("CustomerName", sap.ui.model.FilterOperator.Contains, Input),
						new sap.ui.model.Filter("SoCreatedDate_DISPLAY", sap.ui.model.FilterOperator.Contains, Input),
						new sap.ui.model.Filter("CustomerCode", sap.ui.model.FilterOperator.Contains, Input),
						new sap.ui.model.Filter("TotalAmountExVat", sap.ui.model.FilterOperator.Contains, Input),
						new sap.ui.model.Filter("Gm1", sap.ui.model.FilterOperator.Contains, Input),
						new sap.ui.model.Filter("Gm1Percent", sap.ui.model.FilterOperator.Contains, Input)
					],
					and: false
				});
				aFilter.push(selectFilter);
				oTable = this.getView().byId("MobileSOTable");
				oBinding = oTable.getBinding("items");
				oBinding.filter(aFilter);
			}
			else
			{
				oTable = this.getView().byId("MobileSOTable");
				oBinding = oTable.getBinding("items");
				oBinding.filter(aFilter);
			}
		},
		
		
		MobileSelectionDropdown: function(Status){
			var t = this;

			var PendingApproval = t.i18nBundle.getText("PendingApprovalSelection");
			var PendingOthers = t.i18nBundle.getText("PendingOtherSelection");
			var Completed = t.i18nBundle.getText("CompletedSelection");
			var Rejected = t.i18nBundle.getText("RejectedSelection");
			
				var oData = {
				"DefaultSelection": Status,
				"Selection": [
					{
						"Id": PendingApproval,
						"Name": PendingApproval,
						"Icon": "sap-icon://message-warning",
						"additionalText": totalApproval,
						"Value": PendingApproval
					},
					{
						"Id": PendingOthers,
						"Name": PendingOthers,
						"Icon": "sap-icon://paper-plane",
						"additionalText": totalPending,
						"Value": PendingOthers
					},
					{
						"Id": Completed,
						"Name": Completed,
						"Icon": "sap-icon://complete",
						"additionalText": totalCompleted,
						"Value": Completed
					},
					{
						"Id": Rejected,
						"Name": Rejected,
						"Icon": "sap-icon://cancel",
						"additionalText": totalRejected,
						"Value": Rejected
					}
				]
			};

			var oModel = new JSONModel(oData);
			this.getView().setModel(oModel);
		},
		onSelectChange: function(oEvent){
			var t = this;
        	var selection = oEvent.getSource().getSelectedKey();
			
			t.gv_selection = selection;
			
			var PendingApproval = t.i18nBundle.getText("PENDA");
			var PendingOthers = t.i18nBundle.getText("PENDO");
			var Completed = t.i18nBundle.getText("COMPT");
			var Rejected = t.i18nBundle.getText("REJET");
			
        	if(selection === "Pending Approval")
        	{
        		t.SetupMobileODataServicesWithoutChange(PendingApproval);
        		
        	}
        	else if (selection === "Pending Others")
        	{
        		t.SetupMobileODataServicesWithoutChange(PendingOthers);
        	}
        	else if (selection === "Completed")
        	{
        		t.SetupMobileODataServicesWithoutChange(Completed);
        		
        	}
        	else if (selection === "Rejected")
        	{
        		t.SetupMobileODataServicesWithoutChange(Rejected);
        		
        	}
		},
		DateFormat: function()
		{
			var lv_pattern = "dd.MM.yyyy";
			return sap.ui.core.format.DateFormat.getDateTimeInstance({pattern: lv_pattern});
		},
		showBusyDialog: function() 
		{
			return new sap.m.BusyDialog({});
		}
	});
	
});