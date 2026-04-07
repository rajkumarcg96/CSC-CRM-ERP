/**
 * GYAN ERP - Master Backend Script (FINAL COMPLETE VERSION)
 */

// ⚠️ यहाँ अपने Google Drive फोल्डर की ID डालें ⚠️
var PHOTO_FOLDER_ID = "1lcZoIIlEx3A8JgLmbeQxJ-KaZ7kdFxlB"; 

function doPost(e) {
  var requestData = JSON.parse(e.postData.contents);
  var action = requestData.action;
  var data = requestData.data;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    // 1. LOGIN
    if (action == "login") {
      var rows = ss.getSheetByName("Users").getDataRange().getValues(); 
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][3].toString().trim() == data.phone.toString().trim() && rows[i][4].toString().trim() == data.password.toString().trim()) {
          if(rows[i][6] !== "Active") return res("error", "Account Blocked hai!");
          return res("success", "Login Successful", { name: rows[i][2], role: rows[i][5], permissions: rows[i][11] });
        }
      }
      return res("error", "Galat Mobile Number ya Password!");
    }

    // 2. GROUPS MANAGEMENT
    if (action == "addGroup") {
      var sheet = ss.getSheetByName("Groups");
      if(!sheet) sheet = ss.insertSheet("Groups");
      var rows = sheet.getDataRange().getValues();
      for(var i=0; i<rows.length; i++) { if(rows[i][0].toString().toLowerCase() === data.groupName.toLowerCase()) return res("error", "Group pehle se hai!"); }
      sheet.appendRow([data.groupName, new Date()]);
      return res("success", "Group Added!");
    }
    if (action == "getGroups") {
      var sheet = ss.getSheetByName("Groups");
      var list = ["General", "VIP", "B2B / Partner"]; 
      if(sheet) {
        var rows = sheet.getDataRange().getValues();
        for (var i = 1; i < rows.length; i++) { if(rows[i][0] && !list.includes(rows[i][0])) list.push(rows[i][0]); }
      }
      return res("success", "Groups Fetched", { list: list });
    }

    // 3. STAFF MANAGEMENT (WITH PHOTO, FNAME, EMAIL, ID)
    if (action == "addUser") {
      var sheet = ss.getSheetByName("Users");
      var empId = "EMP-" + (1000 + sheet.getLastRow());
      var photoUrl = "";
      if (data.photoData && PHOTO_FOLDER_ID !== "") {
        try {
          var folder = DriveApp.getFolderById(PHOTO_FOLDER_ID);
          var contentType = data.photoData.substring(5, data.photoData.indexOf(';'));
          var bytes = Utilities.base64Decode(data.photoData.split(',')[1]);
          var blob = Utilities.newBlob(bytes, contentType, empId + "_Photo");
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          photoUrl = file.getUrl();
        } catch(err) { photoUrl = ""; }
      }
      var defaultPerms = (data.role === "Admin" || data.role === "Manager") ? "all" : "add_cust,add_txn";
      sheet.appendRow([sheet.getLastRow(), empId, data.fullName, data.phone, data.password, data.role, "Active", new Date(), data.fName, data.email, data.idNum, defaultPerms, photoUrl]);
      return res("success", "Staff Added Successfully!", { empId: empId, name: data.fullName, role: data.role, phone: data.phone, photoUrl: photoUrl });
    }
    if (action == "getAllUsers") {
      var rows = ss.getSheetByName("Users").getDataRange().getValues();
      var list = [];
      for (var i = 1; i < rows.length; i++) list.push({ empId: rows[i][1], name: rows[i][2], phone: rows[i][3], role: rows[i][5], status: rows[i][6], permissions: rows[i][11], photo: rows[i][12] });
      return res("success", "Fetched", { list: list });
    }
    if (action == "updatePermissions") { var sheet=ss.getSheetByName("Users"); var rows=sheet.getDataRange().getValues(); for(var i=1;i<rows.length;i++){ if(rows[i][3].toString()===data.phone.toString()){ sheet.getRange(i+1,12).setValue(data.newPermissions); return res("success","Settings Updated!"); } } }
    if (action == "deleteStaff") { var sheet=ss.getSheetByName("Users"); var rows=sheet.getDataRange().getValues(); for(var i=1;i<rows.length;i++){ if(rows[i][3].toString()===data.phone.toString()){ sheet.deleteRow(i+1); return res("success","Staff Deleted!"); } } }
    if (action == "updateStaffRole") { var sheet=ss.getSheetByName("Users"); var rows=sheet.getDataRange().getValues(); for(var i=1;i<rows.length;i++){ if(rows[i][3].toString()===data.phone.toString()){ sheet.getRange(i+1,6).setValue(data.newRole); return res("success","Role Updated!"); } } }
    if (action == "toggleStaffStatus") { var sheet=ss.getSheetByName("Users"); var rows=sheet.getDataRange().getValues(); for(var i=1;i<rows.length;i++){ if(rows[i][3].toString()===data.phone.toString()){ var newStatus=rows[i][6]==="Active"?"Blocked":"Active"; sheet.getRange(i+1,7).setValue(newStatus); return res("success","Status updated"); } } }

    // 4. CUSTOMER MODULE (WITH EDIT & GROUP)
    if (action == "addCustomer") {
      var sheet = ss.getSheetByName("Customers");
      var rows = sheet.getDataRange().getValues();
      for(var j=1; j<rows.length; j++) { if(rows[j][4].toString() === data.phone.toString()) return res("error", "Duplicate Mobile!"); }
      sheet.appendRow([sheet.getLastRow(), "C-" + (1000 + sheet.getLastRow()), data.name, data.fatherName, data.phone, data.email, data.dob, data.address, data.idProof, 0, new Date(), data.group]);
      return res("success", "Customer Register Ho Gaya!");
    }
    if (action == "editCustomer") {
      var sheet = ss.getSheetByName("Customers");
      var rows = sheet.getDataRange().getValues();
      for(var i=1; i<rows.length; i++) {
        if(rows[i][4].toString() === data.oldPhone.toString()) {
          sheet.getRange(i+1, 3).setValue(data.name); sheet.getRange(i+1, 4).setValue(data.fatherName);
          sheet.getRange(i+1, 5).setValue(data.phone); sheet.getRange(i+1, 6).setValue(data.email);
          sheet.getRange(i+1, 8).setValue(data.address); sheet.getRange(i+1, 12).setValue(data.group);
          return res("success", "Customer Details Updated!");
        }
      }
      return res("error", "Customer nahi mila!");
    }
    if (action == "searchCustomer") {
      var rows = ss.getSheetByName("Customers").getDataRange().getValues();
      var q = data.searchQuery.toString().toLowerCase().trim();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][2].toString().toLowerCase().includes(q) || rows[i][4].toString().trim() === q || rows[i][5].toString().toLowerCase() === q) {
          return res("success", "Found", { name: rows[i][2], phone: rows[i][4], address: rows[i][7], udhar: rows[i][9], group: rows[i][11] });
        }
      }
      return res("not_found", "Customer nahi mila!");
    }
    if (action == "getAllCustomers") {
      var rows = ss.getSheetByName("Customers").getDataRange().getValues();
      var list = [];
      for (var i = 1; i < rows.length; i++) list.push({ name: rows[i][2], phone: rows[i][4], email: rows[i][5], address: rows[i][7], group: rows[i][11] || 'General', fname: rows[i][3] });
      return res("success", "Fetched", { list: list });
    }

    // 5. SERVICES & TRANSACTION (WITH STATUS & DUE DATE)
    if (action == "addService") {
      var sheet = ss.getSheetByName("Services");
      var rows = sheet.getDataRange().getValues();
      for(var i=1; i<rows.length; i++) { if(rows[i][1].toString().toLowerCase() === data.serviceName.toLowerCase()) return res("error", "Ye service pehle se maujud hai!"); }
      sheet.appendRow([sheet.getLastRow(), data.serviceName, data.appFee, data.bankCharge, data.serviceCharge]);
      return res("success", "Service Added!");
    }
    if (action == "getServices") {
      var rows = ss.getSheetByName("Services").getDataRange().getValues();
      var list = [];
      for (var i = 1; i < rows.length; i++) list.push({ name: rows[i][1], appFee: rows[i][2], bankCharge: rows[i][3], serviceCharge: rows[i][4] });
      return res("success", "Services Fetched", { list: list });
    }
    if (action == "addEntry") {
      var sheet = ss.getSheetByName("Transactions");
      var tRow = sheet.getLastRow();
      sheet.appendRow([tRow, "TXN-"+(5000+tRow), new Date(), data.phone, data.service, data.operator, data.appFee, data.bankCharge, data.serviceCharge, data.totalAmount, "Pending", data.workStatus, data.followUpDate]);
      return res("success", "Transaction Save! Cashier ke paas bhej di gayi.");
    }
    
    // 6. TASKS & STATUS
    if (action == "getTasks") { var rows=ss.getSheetByName("Transactions").getDataRange().getValues(); var tasks=[]; for(var i=rows.length-1;i>=Math.max(1,rows.length-50);i--){ if(rows[i][11]!=="Completed") tasks.push({rowIdx:i+1, id:rows[i][1], name:rows[i][3], service:rows[i][4], status:rows[i][11], operator:rows[i][5], dueDate:rows[i][12]}); } return res("success","Tasks Fetched",{list:tasks}); }
    if (action == "updateWorkStatus") { ss.getSheetByName("Transactions").getRange(data.rowIdx, 12).setValue(data.newStatus); return res("success","Status Update Ho Gaya!"); }
    if (action == "getHistory") { var rows=ss.getSheetByName("Transactions").getDataRange().getValues(); var hist=[]; for(var i=1;i<rows.length;i++){ if(rows[i][3].toString().trim()==data.phone.toString().trim()){ hist.push({rowIdx:i+1, date:rows[i][2], service:rows[i][4], amount:rows[i][9], workStatus:rows[i][11]}); } } return res("success","History Found",{history:hist}); }

    // 7. CASHIER & PAYMENTS
    if (action == "getCashierQueue") { var rows=ss.getSheetByName("Transactions").getDataRange().getValues(); var q=[]; for(var i=1;i<rows.length;i++){ if(rows[i][10]==="Pending") q.push({id:rows[i][1], phone:rows[i][3], service:rows[i][4], amount:rows[i][9]}); } return res("success","Queue Fetched",{list:q}); }
    if (action == "collectPayment") { var txnSheet=ss.getSheetByName("Transactions"); var txnRows=txnSheet.getDataRange().getValues(); for(var i=1;i<txnRows.length;i++){ if(txnRows[i][1]===data.txnId){ txnSheet.getRange(i+1,11).setValue("Paid via "+data.payMode); break; } } var udharAmount=Number(data.udharAmount); if(udharAmount>0){ var custSheet=ss.getSheetByName("Customers"); var custRows=custSheet.getDataRange().getValues(); for(var j=1;j<custRows.length;j++){ if(custRows[j][4].toString()===data.phone.toString()){ custSheet.getRange(j+1,10).setValue((Number(custRows[j][9])||0)+udharAmount); break; } } } return res("success","Payment Successfully Collected!"); }
    if (action == "getKhata") { var rows=ss.getSheetByName("Customers").getDataRange().getValues(); var khata=[]; for(var i=1;i<rows.length;i++){ if(Number(rows[i][9])>0) khata.push({name:rows[i][2], phone:rows[i][4], balance:rows[i][9]}); } return res("success","Khata Fetched",{list:khata}); }

    // 8. DASHBOARD & REPORTS (ALL 5 REPORTS)
    if (action == "getDashboardStats") { var txnRows=ss.getSheetByName("Transactions").getDataRange().getValues(); var today=new Date().toLocaleDateString(); var stats={col:0,pen:0,pro:0,tasks:0}; for(var i=1;i<txnRows.length;i++){ if(new Date(txnRows[i][2]).toLocaleDateString()===today){ stats.tasks++; if(txnRows[i][10].toString().includes("Paid")){ stats.col+=Number(txnRows[i][9])||0; stats.pro+=Number(txnRows[i][8])||0; } else{ stats.pen+=Number(txnRows[i][9])||0; } } } return res("success","Stats Fetched",stats); }
    if (action == "getReports") {
      var txnRows = ss.getSheetByName("Transactions").getDataRange().getValues();
      var custRows = ss.getSheetByName("Customers").getDataRange().getValues();
      var filterDateStr = data.reportDate ? new Date(data.reportDate).toLocaleDateString() : new Date().toLocaleDateString();
      var todayReport = []; var serviceMap = {}; var customerMap = {};
      for (var i = 1; i < txnRows.length; i++) {
        var rowDate = new Date(txnRows[i][2]).toLocaleDateString(); var phone = txnRows[i][3]; var srv = txnRows[i][4]; var amt = Number(txnRows[i][9]) || 0;
        if (rowDate === filterDateStr) todayReport.push({ id: txnRows[i][1], phone: phone, service: srv, amount: amt, operator: txnRows[i][5] });
        if (!serviceMap[srv]) serviceMap[srv] = { count: 0, revenue: 0 }; serviceMap[srv].count++; serviceMap[srv].revenue += amt;
        if (!customerMap[phone]) customerMap[phone] = { count: 0, revenue: 0 }; customerMap[phone].count++; customerMap[phone].revenue += amt;
      }
      var groupMap = {};
      for(var j = 1; j < custRows.length; j++) {
         var g = custRows[j][11] || 'General'; var cName = custRows[j][2]; var cPhone = custRows[j][4];
         if(!groupMap[g]) groupMap[g] = []; groupMap[g].push({name: cName, phone: cPhone});
      }
      var serviceReport = Object.keys(serviceMap).map(function(k) { return { service: k, count: serviceMap[k].count, revenue: serviceMap[k].revenue }; });
      var customerReport = Object.keys(customerMap).map(function(k) { return { phone: k, count: customerMap[k].count, revenue: customerMap[k].revenue }; });
      var groupReport = Object.keys(groupMap).map(function(k) { return { group: k, customers: groupMap[k] }; });
      return res("success", "Reports fetched", { today: todayReport, serviceWise: serviceReport, customerWise: customerReport, groupWise: groupReport });
    }

  } catch (err) { return res("error", "Server Error: " + err.toString()); }
}

function res(status, msg, userObj = null) {
  var output = {"status": status, "message": msg};
  if(userObj) output.user = userObj;
  return ContentService.createTextOutput(JSON.stringify(output)).setMimeType(ContentService.MimeType.JSON);
}