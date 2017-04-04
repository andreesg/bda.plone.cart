/*!
 *  BarCode Coder Library (BCC Library)
 *  BCCL Version 2.0
 *    
 *  Porting : jQuery barcode plugin 
 *  Version : 2.0.3
 *   
 *  Date    : 2013-01-06
 *  Author  : DEMONTE Jean-Baptiste <jbdemonte@gmail.com>
 *            HOUREZ Jonathan
 *             
 *  Web site: http://barcode-coder.com/
 *  dual licence :  http://www.cecill.info/licences/Licence_CeCILL_V2-fr.html
 *                  http://www.gnu.org/licenses/gpl.html
 */

(function ($) {
  
  var barcode = {
    settings:{
      barWidth: 1,
      barHeight: 50,
      moduleSize: 5,
      showHRI: true,
      addQuietZone: true,
      marginHRI: 5,
      bgColor: "#FFFFFF",
      color: "#000000",
      fontSize: 10,
      output: "css",
      posX: 0,
      posY: 0
    },
    intval: function(val){
      var type = typeof( val );
      if (type == 'string'){
        val = val.replace(/[^0-9-.]/g, "");
        val = parseInt(val * 1, 10);
        return isNaN(val) || !isFinite(val) ? 0 : val;
      }
      return type == 'number' && isFinite(val) ? Math.floor(val) : 0;
    },
    i25: { // std25 int25
      encoding: ["NNWWN", "WNNNW", "NWNNW", "WWNNN", "NNWNW", "WNWNN", "NWWNN", "NNNWW", "WNNWN","NWNWN"],
      compute: function(code, crc, type){
        if (! crc) {
          if (code.length % 2 != 0) code = '0' + code;
        } else {
          if ( (type == "int25") && (code.length % 2 == 0) ) code = '0' + code;
          var odd = true, v, sum = 0;
          for(var i=code.length-1; i>-1; i--){
            v = barcode.intval(code.charAt(i));
            if (isNaN(v)) return("");
            sum += odd ? 3 * v : v;
            odd = ! odd;
          }
          code += ((10 - sum % 10) % 10).toString();
        }
        return(code);
      },
      getDigit: function(code, crc, type){
        code = this.compute(code, crc, type);
        if (code == "") return("");
        result = "";
        
        var i, j;
        if (type == "int25") {
          // Interleaved 2 of 5
          
          // start
          result += "1010";
          
          // digits + CRC
          var c1, c2;
          for(i=0; i<code.length / 2; i++){
            c1 = code.charAt(2*i);
            c2 = code.charAt(2*i+1);
            for(j=0; j<5; j++){
              result += '1';
              if (this.encoding[c1].charAt(j) == 'W') result += '1';
              result += '0';
              if (this.encoding[c2].charAt(j) == 'W') result += '0';
            }
          }
          // stop
          result += "1101";
        } else if (type == "std25") {
          // Standard 2 of 5 is a numeric-only barcode that has been in use a long time. 
          // Unlike Interleaved 2 of 5, all of the information is encoded in the bars; the spaces are fixed width and are used only to separate the bars.
          // The code is self-checking and does not include a checksum.
          
          // start
          result += "11011010";
          
          // digits + CRC
          var c;
          for(i=0; i<code.length; i++){
            c = code.charAt(i);
            for(j=0; j<5; j++){
              result += '1';
              if (this.encoding[c].charAt(j) == 'W') result += "11";
              result += '0';
            }
          }
          // stop
          result += "11010110";
        }
        return(result);
      }
    },
    ean: {
      encoding: [ ["0001101", "0100111", "1110010"],
                  ["0011001", "0110011", "1100110"], 
                  ["0010011", "0011011", "1101100"],
                  ["0111101", "0100001", "1000010"], 
                  ["0100011", "0011101", "1011100"], 
                  ["0110001", "0111001", "1001110"],
                  ["0101111", "0000101", "1010000"],
                  ["0111011", "0010001", "1000100"],
                  ["0110111", "0001001", "1001000"],
                  ["0001011", "0010111", "1110100"] ],
      first:  ["000000","001011","001101","001110","010011","011001","011100","010101","010110","011010"],
      getDigit: function(code, type){
        // Check len (12 for ean13, 7 for ean8)
        var len = type == "ean8" ? 7 : 12;
        code = code.substring(0, len);
        if (code.length != len) return("");
        // Check each digit is numeric
        var c;
        for(var i=0; i<code.length; i++){
          c = code.charAt(i);
          if ( (c < '0') || (c > '9') ) return("");
        }
        // get checksum
        code = this.compute(code, type);
        
        // process analyse
        var result = "101"; // start
        
        if (type == "ean8"){
  
          // process left part
          for(var i=0; i<4; i++){
            result += this.encoding[barcode.intval(code.charAt(i))][0];
          }
              
          // center guard bars
          result += "01010";
              
          // process right part
          for(var i=4; i<8; i++){
            result += this.encoding[barcode.intval(code.charAt(i))][2];
          }
              
        } else { // ean13
          // extract first digit and get sequence
          var seq = this.first[ barcode.intval(code.charAt(0)) ];
          
          // process left part
          for(var i=1; i<7; i++){
            result += this.encoding[barcode.intval(code.charAt(i))][ barcode.intval(seq.charAt(i-1)) ];
          }
          
          // center guard bars
          result += "01010";
              
          // process right part
          for(var i=7; i<13; i++){
            result += this.encoding[barcode.intval(code.charAt(i))][ 2 ];
          }
        } // ean13
        
        result += "101"; // stop
        return(result);
      },
      compute: function (code, type){
        var len = type == "ean13" ? 12 : 7;
        code = code.substring(0, len);
        var sum = 0, odd = true;
        for(i=code.length-1; i>-1; i--){
          sum += (odd ? 3 : 1) * barcode.intval(code.charAt(i));
          odd = ! odd;
        }
        return(code + ((10 - sum % 10) % 10).toString());
      }
    },
    upc: {
      getDigit: function(code){
        if (code.length < 12) {
          code = '0' + code;
        }
        return barcode.ean.getDigit(code, 'ean13');
      },
      compute: function (code){
        if (code.length < 12) {
          code = '0' + code;
        }
        return barcode.ean.compute(code, 'ean13').substr(1);
      }
    },
    msi: {
      encoding:["100100100100", "100100100110", "100100110100", "100100110110",
                "100110100100", "100110100110", "100110110100", "100110110110",
                "110100100100", "110100100110"],
      compute: function(code, crc){
        if (typeof(crc) == "object"){
          if (crc.crc1 == "mod10"){
            code = this.computeMod10(code);
          } else if (crc.crc1 == "mod11"){
            code = this.computeMod11(code);
          }
          if (crc.crc2 == "mod10"){
            code = this.computeMod10(code);
          } else if (crc.crc2 == "mod11"){
            code = this.computeMod11(code);
          }
        } else if (typeof(crc) == "boolean"){
          if (crc) code = this.computeMod10(code);
        }
        return(code);
      },
      computeMod10:function(code){
        var i, 
        toPart1 = code.length % 2;
        var n1 = 0, sum = 0;
        for(i=0; i<code.length; i++){
          if (toPart1) {
            n1 = 10 * n1 + barcode.intval(code.charAt(i));
          } else {
            sum += barcode.intval(code.charAt(i));
          }
          toPart1 = ! toPart1;
        }
        var s1 = (2 * n1).toString();
        for(i=0; i<s1.length; i++){
          sum += barcode.intval(s1.charAt(i));
        }
        return(code + ((10 - sum % 10) % 10).toString());
      },
      computeMod11:function(code){
        var sum = 0, weight = 2;
        for(var i=code.length-1; i>=0; i--){
          sum += weight * barcode.intval(code.charAt(i));
          weight = weight == 7 ? 2 : weight + 1;
        }
        return(code + ((11 - sum % 11) % 11).toString());
      },
      getDigit: function(code, crc){
        var table = "0123456789";
        var index = 0;
        var result = "";
        
        code = this.compute(code, false);
        
        // start
        result = "110";
        
        // digits
        for(i=0; i<code.length; i++){
          index = table.indexOf( code.charAt(i) );
          if (index < 0) return("");
          result += this.encoding[ index ];
        }
        
        // stop
        result += "1001";
        
        return(result);
      }
    },
    code11: {
      encoding:[  "101011", "1101011", "1001011", "1100101",
                  "1011011", "1101101", "1001101", "1010011",
                  "1101001", "110101", "101101"],
      getDigit: function(code){
        var table = "0123456789-";
        var i, index, result = "", intercharacter = '0'
        
        // start
        result = "1011001" + intercharacter;
        
        // digits
        for(i=0; i<code.length; i++){
          index = table.indexOf( code.charAt(i) );
          if (index < 0) return("");
          result += this.encoding[ index ] + intercharacter;
        }
        
        // checksum
        var weightC    = 0,
        weightSumC = 0,
        weightK    = 1, // start at 1 because the right-most character is "C" checksum
        weightSumK   = 0;
        for(i=code.length-1; i>=0; i--){
          weightC = weightC == 10 ? 1 : weightC + 1;
          weightK = weightK == 10 ? 1 : weightK + 1;
          
          index = table.indexOf( code.charAt(i) );
          
          weightSumC += weightC * index;
          weightSumK += weightK * index;
        }
        
        var c = weightSumC % 11;
        weightSumK += c;
        var k = weightSumK % 11;
        
        result += this.encoding[c] + intercharacter;
        
        if (code.length >= 10){
          result += this.encoding[k] + intercharacter;
        }
        
        // stop
        result  += "1011001";
        
        return(result);
      }   
    },
    code39: {
      encoding:["101001101101", "110100101011", "101100101011", "110110010101",
                "101001101011", "110100110101", "101100110101", "101001011011",
                "110100101101", "101100101101", "110101001011", "101101001011",
                "110110100101", "101011001011", "110101100101", "101101100101",
                "101010011011", "110101001101", "101101001101", "101011001101",
                "110101010011", "101101010011", "110110101001", "101011010011",
                "110101101001", "101101101001", "101010110011", "110101011001",
                "101101011001", "101011011001", "110010101011", "100110101011",
                "110011010101", "100101101011", "110010110101", "100110110101",
                "100101011011", "110010101101", "100110101101", "100100100101",
                "100100101001", "100101001001", "101001001001", "100101101101"],
      getDigit: function(code){
        var table = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%*";
        var i, index, result="", intercharacter='0';
        
        if (code.indexOf('*') >= 0) return("");
        
        // Add Start and Stop charactere : *
        code = ("*" + code + "*").toUpperCase();
        
        for(i=0; i<code.length; i++){
          index = table.indexOf( code.charAt(i) );
          if (index < 0) return("");
          if (i > 0) result += intercharacter;
          result += this.encoding[ index ];
        }
        return(result);
      }
    },
    code93:{
      encoding:["100010100", "101001000", "101000100", "101000010",
                "100101000", "100100100", "100100010", "101010000",
                "100010010", "100001010", "110101000", "110100100",
                "110100010", "110010100", "110010010", "110001010",
                "101101000", "101100100", "101100010", "100110100",
                "100011010", "101011000", "101001100", "101000110",
                "100101100", "100010110", "110110100", "110110010",
                "110101100", "110100110", "110010110", "110011010",
                "101101100", "101100110", "100110110", "100111010",
                "100101110", "111010100", "111010010", "111001010",
                "101101110", "101110110", "110101110", "100100110",
                "111011010", "111010110", "100110010", "101011110"],
      getDigit: function(code, crc){
        var table = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%____*", // _ => ($), (%), (/) et (+)
        c, result = "";
        
        if (code.indexOf('*') >= 0) return("");
        
        code = code.toUpperCase();
        
        // start :  *
        result  += this.encoding[47];
        
        // digits
        for(i=0; i<code.length; i++){
          c = code.charAt(i);
          index = table.indexOf( c );
          if ( (c == '_') || (index < 0) ) return("");
          result += this.encoding[ index ];
        }
        
        // checksum
        if (crc){
          var weightC    = 0,
          weightSumC = 0,
          weightK    = 1, // start at 1 because the right-most character is "C" checksum
          weightSumK   = 0;
          for(i=code.length-1; i>=0; i--){
            weightC = weightC == 20 ? 1 : weightC + 1;
            weightK = weightK == 15 ? 1 : weightK + 1;
            
            index = table.indexOf( code.charAt(i) );
            
            weightSumC += weightC * index;
            weightSumK += weightK * index;
          }
          
          var c = weightSumC % 47;
          weightSumK += c;
          var k = weightSumK % 47;
          
          result += this.encoding[c];
          result += this.encoding[k];
        }
        
        // stop : *
        result  += this.encoding[47];
        
        // Terminaison bar
        result  += '1';
        return(result);
      }
    },
    code128: {
      encoding:["11011001100", "11001101100", "11001100110", "10010011000",
                "10010001100", "10001001100", "10011001000", "10011000100",
                "10001100100", "11001001000", "11001000100", "11000100100",
                "10110011100", "10011011100", "10011001110", "10111001100",
                "10011101100", "10011100110", "11001110010", "11001011100",
                "11001001110", "11011100100", "11001110100", "11101101110",
                "11101001100", "11100101100", "11100100110", "11101100100",
                "11100110100", "11100110010", "11011011000", "11011000110",
                "11000110110", "10100011000", "10001011000", "10001000110",
                "10110001000", "10001101000", "10001100010", "11010001000",
                "11000101000", "11000100010", "10110111000", "10110001110",
                "10001101110", "10111011000", "10111000110", "10001110110",
                "11101110110", "11010001110", "11000101110", "11011101000",
                "11011100010", "11011101110", "11101011000", "11101000110",
                "11100010110", "11101101000", "11101100010", "11100011010",
                "11101111010", "11001000010", "11110001010", "10100110000",
                "10100001100", "10010110000", "10010000110", "10000101100",
                "10000100110", "10110010000", "10110000100", "10011010000",
                "10011000010", "10000110100", "10000110010", "11000010010",
                "11001010000", "11110111010", "11000010100", "10001111010",
                "10100111100", "10010111100", "10010011110", "10111100100",
                "10011110100", "10011110010", "11110100100", "11110010100",
                "11110010010", "11011011110", "11011110110", "11110110110",
                "10101111000", "10100011110", "10001011110", "10111101000",
                "10111100010", "11110101000", "11110100010", "10111011110",
                "10111101110", "11101011110", "11110101110", "11010000100",
                "11010010000", "11010011100", "11000111010"],
      getDigit: function(code){
        var tableB = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
        var result = "";
        var sum = 0;
        var isum = 0;
        var i = 0;
        var j = 0;
        var value = 0;
        
        // check each characters
        for(i=0; i<code.length; i++){
          if (tableB.indexOf(code.charAt(i)) == -1) return("");
        }
        
        // check firsts characters : start with C table only if enought numeric
        var tableCActivated = code.length > 1;
        var c = '';
        for(i=0; i<3 && i<code.length; i++){
        c = code.charAt(i);
          tableCActivated &= c >= '0' && c <= '9';
        }
        
        sum = tableCActivated ? 105 : 104;
        
        // start : [105] : C table or [104] : B table 
        result = this.encoding[ sum ];
        
        i = 0;
        while( i < code.length ){
          if (! tableCActivated){
            j = 0;
            // check next character to activate C table if interresting
            while ( (i + j < code.length) && (code.charAt(i+j) >= '0') && (code.charAt(i+j) <= '9') ) j++;
            
            // 6 min everywhere or 4 mini at the end
            tableCActivated = (j > 5) || ((i + j - 1 == code.length) && (j > 3));
            
            if ( tableCActivated ){
            result += this.encoding[ 99 ]; // C table
            sum += ++isum * 99;
            }
            //         2 min for table C so need table B
          } else if ( (i == code.length) || (code.charAt(i) < '0') || (code.charAt(i) > '9') || (code.charAt(i+1) < '0') || (code.charAt(i+1) > '9') ) {
            tableCActivated = false;
            result += this.encoding[ 100 ]; // B table
            sum += ++isum * 100;
          }
          
          if ( tableCActivated ) {
            value = barcode.intval(code.charAt(i) + code.charAt(i+1)); // Add two characters (numeric)
            i += 2;
          } else {
            value = tableB.indexOf( code.charAt(i) ); // Add one character
            i += 1;
          }
          result  += this.encoding[ value ];
          sum += ++isum * value;
        }
        
        // Add CRC
        result  += this.encoding[ sum % 103 ];
        
        // Stop
        result += this.encoding[106];
        
        // Termination bar
        result += "11";
        
        return(result);
      }
    },
    codabar: {
      encoding:["101010011", "101011001", "101001011", "110010101",
                "101101001", "110101001", "100101011", "100101101",
                "100110101", "110100101", "101001101", "101100101",
                "1101011011", "1101101011", "1101101101", "1011011011",
                "1011001001", "1010010011", "1001001011", "1010011001"],
      getDigit: function(code){
        var table = "0123456789-$:/.+";
        var i, index, result="", intercharacter = '0';
        
        // add start : A->D : arbitrary choose A
        result += this.encoding[16] + intercharacter;
        
        for(i=0; i<code.length; i++){
          index = table.indexOf( code.charAt(i) );
          if (index < 0) return("");
          result += this.encoding[ index ] + intercharacter;
        }
        
        // add stop : A->D : arbitrary choose A
        result += this.encoding[16];
        return(result);
      }
    },
    datamatrix: {
      lengthRows:       [ 10, 12, 14, 16, 18, 20, 22, 24, 26,  // 24 squares et 6 rectangular
                          32, 36, 40, 44, 48, 52, 64, 72, 80,  88, 96, 104, 120, 132, 144,
                          8, 8, 12, 12, 16, 16],
      lengthCols:       [ 10, 12, 14, 16, 18, 20, 22, 24, 26,  // Number of columns for the entire datamatrix
                          32, 36, 40, 44, 48, 52, 64, 72, 80, 88, 96, 104, 120, 132, 144,
                          18, 32, 26, 36, 36, 48],
      dataCWCount:      [ 3, 5, 8, 12,  18,  22,  30,  36,  // Number of data codewords for the datamatrix
                          44, 62, 86, 114, 144, 174, 204, 280, 368, 456, 576, 696, 816, 1050, 
                          1304, 1558, 5, 10, 16, 22, 32, 49],
      solomonCWCount:   [ 5, 7, 10, 12, 14, 18, 20, 24, 28, // Number of Reed-Solomon codewords for the datamatrix
                          36, 42, 48, 56, 68, 84, 112, 144, 192, 224, 272, 336, 408, 496, 620,
                          7, 11, 14, 18, 24, 28],
      dataRegionRows:   [ 8, 10, 12, 14, 16, 18, 20, 22, // Number of rows per region
                          24, 14, 16, 18, 20, 22, 24, 14, 16, 18, 20, 22, 24, 18, 20, 22,
                          6,  6, 10, 10, 14, 14],
      dataRegionCols:   [ 8, 10, 12, 14, 16, 18, 20, 22, // Number of columns per region
                          24, 14, 16, 18, 20, 22, 24, 14, 16, 18, 20, 22, 24, 18, 20, 22,
                          16, 14, 24, 16, 16, 22],
      regionRows:       [ 1, 1, 1, 1, 1, 1, 1, 1, // Number of regions per row
                          1, 2, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4, 6, 6, 6,
                          1, 1, 1, 1, 1, 1],
      regionCols:       [ 1, 1, 1, 1, 1, 1, 1, 1, // Number of regions per column
                          1, 2, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4, 6, 6, 6,
                          1, 2, 1, 2, 2, 2],
      interleavedBlocks:[ 1, 1, 1, 1, 1, 1, 1, 1, // Number of blocks
                          1, 1, 1, 1, 1, 1, 2, 2, 4, 4, 4, 4, 6, 6, 8, 8,
                          1, 1, 1, 1, 1, 1],
      logTab:           [ -255, 255, 1, 240, 2, 225, 241, 53, 3,  // Table of log for the Galois field
                          38, 226, 133, 242, 43, 54, 210, 4, 195, 39, 114, 227, 106, 134, 28, 
                          243, 140, 44, 23, 55, 118, 211, 234, 5, 219, 196, 96, 40, 222, 115, 
                          103, 228, 78, 107, 125, 135, 8, 29, 162, 244, 186, 141, 180, 45, 99, 
                          24, 49, 56, 13, 119, 153, 212, 199, 235, 91, 6, 76, 220, 217, 197, 
                          11, 97, 184, 41, 36, 223, 253, 116, 138, 104, 193, 229, 86, 79, 171, 
                          108, 165, 126, 145, 136, 34, 9, 74, 30, 32, 163, 84, 245, 173, 187, 
                          204, 142, 81, 181, 190, 46, 88, 100, 159, 25, 231, 50, 207, 57, 147, 
                          14, 67, 120, 128, 154, 248, 213, 167, 200, 63, 236, 110, 92, 176, 7, 
                          161, 77, 124, 221, 102, 218, 95, 198, 90, 12, 152, 98, 48, 185, 179, 
                          42, 209, 37, 132, 224, 52, 254, 239, 117, 233, 139, 22, 105, 27, 194, 
                          113, 230, 206, 87, 158, 80, 189, 172, 203, 109, 175, 166, 62, 127, 
                          247, 146, 66, 137, 192, 35, 252, 10, 183, 75, 216, 31, 83, 33, 73, 
                          164, 144, 85, 170, 246, 65, 174, 61, 188, 202, 205, 157, 143, 169, 82, 
                          72, 182, 215, 191, 251, 47, 178, 89, 151, 101, 94, 160, 123, 26, 112, 
                          232, 21, 51, 238, 208, 131, 58, 69, 148, 18, 15, 16, 68, 17, 121, 149, 
                          129, 19, 155, 59, 249, 70, 214, 250, 168, 71, 201, 156, 64, 60, 237, 
                          130, 111, 20, 93, 122, 177, 150],
      aLogTab:          [ 1, 2, 4, 8, 16, 32, 64, 128, 45, 90, // Table of aLog for the Galois field
                          180, 69, 138, 57, 114, 228, 229, 231, 227, 235, 251, 219, 155, 27, 54, 
                          108, 216, 157, 23, 46, 92, 184, 93, 186, 89, 178, 73, 146, 9, 18, 36, 
                          72, 144, 13, 26, 52, 104, 208, 141, 55, 110, 220, 149, 7, 14, 28, 56, 
                          112, 224, 237, 247, 195, 171, 123, 246, 193, 175, 115, 230, 225, 239, 
                          243, 203, 187, 91, 182, 65, 130, 41, 82, 164, 101, 202, 185, 95, 190, 
                          81, 162, 105, 210, 137, 63, 126, 252, 213, 135, 35, 70, 140, 53, 106, 
                          212, 133, 39, 78, 156, 21, 42, 84, 168, 125, 250, 217, 159, 19, 38, 76, 
                          152, 29, 58, 116, 232, 253, 215, 131, 43, 86, 172, 117, 234, 249, 223, 
                          147, 11, 22, 44, 88, 176, 77, 154, 25, 50, 100, 200, 189, 87, 174, 113, 
                          226, 233, 255, 211, 139, 59, 118, 236, 245, 199, 163, 107, 214, 129, 
                          47, 94, 188, 85, 170, 121, 242, 201, 191, 83, 166, 97, 194, 169, 127, 
                          254, 209, 143, 51, 102, 204, 181, 71, 142, 49, 98, 196, 165, 103, 206, 
                          177, 79, 158, 17, 34, 68, 136, 61, 122, 244, 197, 167, 99, 198, 161, 
                          111, 222, 145, 15, 30, 60, 120, 240, 205, 183, 67, 134, 33, 66, 132, 
                          37, 74, 148, 5, 10, 20, 40, 80, 160, 109, 218, 153, 31, 62, 124, 248, 
                          221, 151, 3, 6, 12, 24, 48, 96, 192, 173, 119, 238, 241, 207, 179, 75, 
                          150, 1],
      champGaloisMult: function(a, b){  // MULTIPLICATION IN GALOIS FIELD GF(2^8)
        if(!a || !b) return 0;
        return this.aLogTab[(this.logTab[a] + this.logTab[b]) % 255];
      },
      champGaloisDoub: function(a, b){  // THE OPERATION a * 2^b IN GALOIS FIELD GF(2^8)
        if (!a) return 0;
        if (!b) return a;
        return this.aLogTab[(this.logTab[a] + b) % 255];
      },
      champGaloisSum: function(a, b){ // SUM IN GALOIS FIELD GF(2^8)
        return a ^ b;
      },
      selectIndex: function(dataCodeWordsCount, rectangular){ // CHOOSE THE GOOD INDEX FOR TABLES
        if ((dataCodeWordsCount<1 || dataCodeWordsCount>1558) && !rectangular) return -1;
        if ((dataCodeWordsCount<1 || dataCodeWordsCount>49) && rectangular)  return -1;
        
        var n = 0;
        if ( rectangular ) n = 24;
        
        while (this.dataCWCount[n] < dataCodeWordsCount) n++;
        return n;
      },
      encodeDataCodeWordsASCII: function(text) {
        var dataCodeWords = new Array();
        var n = 0, i, c;
        for (i=0; i<text.length; i++){
          c = text.charCodeAt(i);
          if (c > 127) {  
            dataCodeWords[n] = 235;
            c = c - 127;
            n++;
          } else if ((c>=48 && c<=57) && (i+1<text.length) && (text.charCodeAt(i+1)>=48 && text.charCodeAt(i+1)<=57)) {
            c = ((c - 48) * 10) + ((text.charCodeAt(i+1))-48);
            c += 130;
            i++;
          } else c++; 
          dataCodeWords[n] = c;
          n++;
        }
        return dataCodeWords;
      },
      addPadCW: function(tab, from, to){    
        if (from >= to) return ;
        tab[from] = 129;
        var r, i;
        for (i=from+1; i<to; i++){
          r = ((149 * (i+1)) % 253) + 1;
          tab[i] = (129 + r) % 254;
        }
      },
      calculSolFactorTable: function(solomonCWCount){ // CALCULATE THE REED SOLOMON FACTORS
        var g = new Array();
        var i, j;
        
        for (i=0; i<=solomonCWCount; i++) g[i] = 1;
        
        for(i = 1; i <= solomonCWCount; i++) {
          for(j = i - 1; j >= 0; j--) {
            g[j] = this.champGaloisDoub(g[j], i);  
            if(j > 0) g[j] = this.champGaloisSum(g[j], g[j-1]);
          }
        }
        return g;
      },
      addReedSolomonCW: function(nSolomonCW, coeffTab, nDataCW, dataTab, blocks){ // Add the Reed Solomon codewords
        var temp = 0;    
        var errorBlocks = nSolomonCW / blocks;
        var correctionCW = new Array();
        
        var i,j,k;
        for(k = 0; k < blocks; k++) {      
          for (i=0; i<errorBlocks; i++) correctionCW[i] = 0;
          
          for (i=k; i<nDataCW; i=i+blocks){    
            temp = this.champGaloisSum(dataTab[i], correctionCW[errorBlocks-1]);
            for (j=errorBlocks-1; j>=0; j--){     
              if ( !temp ) {
                correctionCW[j] = 0;
              } else { 
                correctionCW[j] = this.champGaloisMult(temp, coeffTab[j]);
              }
              if (j>0) correctionCW[j] = this.champGaloisSum(correctionCW[j-1], correctionCW[j]);
            }
          }
          // Renversement des blocs calcules
          j = nDataCW + k;
          for (i=errorBlocks-1; i>=0; i--){
            dataTab[j] = correctionCW[i];
            j=j+blocks;
          }
        }
        return dataTab;
      },
      getBits: function(entier){ // Transform integer to tab of bits
        var bits = new Array();
        for (var i=0; i<8; i++){
          bits[i] = entier & (128 >> i) ? 1 : 0;
        }
        return bits;
      },
      next: function(etape, totalRows, totalCols, codeWordsBits, datamatrix, assigned){ // Place codewords into the matrix
        var chr = 0; // Place of the 8st bit from the first character to [4][0]
        var row = 4;
        var col = 0;
        
        do {
          // Check for a special case of corner
          if((row == totalRows) && (col == 0)){
            this.patternShapeSpecial1(datamatrix, assigned, codeWordsBits[chr], totalRows, totalCols);  
            chr++;
          } else if((etape<3) && (row == totalRows-2) && (col == 0) && (totalCols%4 != 0)){
            this.patternShapeSpecial2(datamatrix, assigned, codeWordsBits[chr], totalRows, totalCols);
            chr++;
          } else if((row == totalRows-2) && (col == 0) && (totalCols%8 == 4)){
            this.patternShapeSpecial3(datamatrix, assigned, codeWordsBits[chr], totalRows, totalCols);
            chr++;
          }
          else if((row == totalRows+4) && (col == 2) && (totalCols%8 == 0)){
            this.patternShapeSpecial4(datamatrix, assigned, codeWordsBits[chr], totalRows, totalCols);
            chr++;
          }
          
          // Go up and right in the datamatrix
          do {
            if((row < totalRows) && (col >= 0) && (assigned[row][col]!=1)) {
              this.patternShapeStandard(datamatrix, assigned, codeWordsBits[chr], row, col, totalRows, totalCols);
              chr++;
            }
            row -= 2;
            col += 2;      
          } while ((row >= 0) && (col < totalCols));
          row += 1;
          col += 3;
          
          // Go down and left in the datamatrix
          do {
            if((row >= 0) && (col < totalCols) && (assigned[row][col]!=1)){
              this.patternShapeStandard(datamatrix, assigned, codeWordsBits[chr], row, col, totalRows, totalCols);
              chr++;
            }
            row += 2;
            col -= 2;
          } while ((row < totalRows) && (col >=0));
          row += 3;
          col += 1;
        } while ((row < totalRows) || (col < totalCols));
      },
      patternShapeStandard: function(datamatrix, assigned, bits, row, col, totalRows, totalCols){ // Place bits in the matrix (standard or special case)
        this.placeBitInDatamatrix(datamatrix, assigned, bits[0], row-2, col-2, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[1], row-2, col-1, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[2], row-1, col-2, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[3], row-1, col-1, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[4], row-1, col, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[5], row, col-2, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[6], row, col-1, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[7], row,  col, totalRows, totalCols);
      },  
      patternShapeSpecial1: function(datamatrix, assigned, bits, totalRows, totalCols ){
        this.placeBitInDatamatrix(datamatrix, assigned, bits[0], totalRows-1,  0, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[1], totalRows-1,  1, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[2], totalRows-1,  2, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[3], 0, totalCols-2, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[4], 0, totalCols-1, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[5], 1, totalCols-1, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[6], 2, totalCols-1, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[7], 3, totalCols-1, totalRows, totalCols);
      },
      patternShapeSpecial2: function(datamatrix, assigned, bits, totalRows, totalCols ){
        this.placeBitInDatamatrix(datamatrix, assigned, bits[0], totalRows-3,  0, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[1], totalRows-2,  0, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[2], totalRows-1,  0, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[3], 0, totalCols-4, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[4], 0, totalCols-3, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[5], 0, totalCols-2, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[6], 0, totalCols-1, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[7], 1, totalCols-1, totalRows, totalCols);
      },  
      patternShapeSpecial3: function(datamatrix, assigned, bits, totalRows, totalCols ){
        this.placeBitInDatamatrix(datamatrix, assigned, bits[0], totalRows-3,  0, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[1], totalRows-2,  0, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[2], totalRows-1,  0, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[3], 0, totalCols-2, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[4], 0, totalCols-1, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[5], 1, totalCols-1, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[6], 2, totalCols-1, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[7], 3, totalCols-1, totalRows, totalCols);
      },
      patternShapeSpecial4: function(datamatrix, assigned, bits, totalRows, totalCols ){
        this.placeBitInDatamatrix(datamatrix, assigned, bits[0], totalRows-1,  0, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[1], totalRows-1, totalCols-1, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[2], 0, totalCols-3, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[3], 0, totalCols-2, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[4], 0, totalCols-1, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[5], 1, totalCols-3, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[6], 1, totalCols-2, totalRows, totalCols);
        this.placeBitInDatamatrix(datamatrix, assigned, bits[7], 1, totalCols-1, totalRows, totalCols);
      },
      placeBitInDatamatrix: function(datamatrix, assigned, bit, row, col, totalRows, totalCols){ // Put a bit into the matrix
        if (row < 0) {
          row += totalRows;
          col += 4 - ((totalRows+4)%8);
        }
        if (col < 0) {
          col += totalCols;
          row += 4 - ((totalCols+4)%8);
        }
        if (assigned[row][col] != 1) {
          datamatrix[row][col] = bit;
          assigned[row][col] = 1;
        }
      },
      addFinderPattern: function(datamatrix, rowsRegion, colsRegion, rowsRegionCW, colsRegionCW){ // Add the finder pattern
        var totalRowsCW = (rowsRegionCW+2) * rowsRegion;
        var totalColsCW = (colsRegionCW+2) * colsRegion;
        
        var datamatrixTemp = new Array();
        datamatrixTemp[0] = new Array();
        for (var j=0; j<totalColsCW+2; j++){
          datamatrixTemp[0][j] = 0;
        }
        for (var i=0; i<totalRowsCW; i++){
          datamatrixTemp[i+1] = new Array();
          datamatrixTemp[i+1][0] = 0;
          datamatrixTemp[i+1][totalColsCW+1] = 0;
          for (var j=0; j<totalColsCW; j++){
            if (i%(rowsRegionCW+2) == 0){
              if (j%2 == 0){
                datamatrixTemp[i+1][j+1] = 1;
              } else { 
                datamatrixTemp[i+1][j+1] = 0;
              }
            } else if (i%(rowsRegionCW+2) == rowsRegionCW+1){ 
              datamatrixTemp[i+1][j+1] = 1;
            } else if (j%(colsRegionCW+2) == colsRegionCW+1){
              if (i%2 == 0){
                datamatrixTemp[i+1][j+1] = 0;
              } else {
                datamatrixTemp[i+1][j+1] = 1;
              }
            } else if (j%(colsRegionCW+2) == 0){ 
              datamatrixTemp[i+1][j+1] = 1;
            } else{
              datamatrixTemp[i+1][j+1] = 0;
              datamatrixTemp[i+1][j+1] = datamatrix[i-1-(2*(parseInt(i/(rowsRegionCW+2))))][j-1-(2*(parseInt(j/(colsRegionCW+2))))];
            }
          }
        }
        datamatrixTemp[totalRowsCW+1] = new Array();
        for (var j=0; j<totalColsCW+2; j++){
          datamatrixTemp[totalRowsCW+1][j] = 0;
        }
        return datamatrixTemp;
      },
      getDigit: function(text, rectangular){
        var dataCodeWords = this.encodeDataCodeWordsASCII(text); // Code the text in the ASCII mode
        var dataCWCount = dataCodeWords.length;
        var index = this.selectIndex(dataCWCount, rectangular); // Select the index for the data tables
        var totalDataCWCount = this.dataCWCount[index]; // Number of data CW
        var solomonCWCount = this.solomonCWCount[index]; // Number of Reed Solomon CW 
        var totalCWCount = totalDataCWCount + solomonCWCount; // Number of CW      
        var rowsTotal = this.lengthRows[index]; // Size of symbol
        var colsTotal = this.lengthCols[index];
        var rowsRegion = this.regionRows[index]; // Number of region
        var colsRegion = this.regionCols[index];
        var rowsRegionCW = this.dataRegionRows[index];
        var colsRegionCW = this.dataRegionCols[index];
        var rowsLengthMatrice = rowsTotal-2*rowsRegion; // Size of matrice data
        var colsLengthMatrice = colsTotal-2*colsRegion;
        var blocks = this.interleavedBlocks[index];  // Number of Reed Solomon blocks
        var errorBlocks = (solomonCWCount / blocks);
        
        this.addPadCW(dataCodeWords, dataCWCount, totalDataCWCount); // Add codewords pads
        
        var g = this.calculSolFactorTable(errorBlocks); // Calculate correction coefficients
        
        this.addReedSolomonCW(solomonCWCount, g, totalDataCWCount, dataCodeWords, blocks); // Add Reed Solomon codewords
        
        var codeWordsBits = new Array(); // Calculte bits from codewords
        for (var i=0; i<totalCWCount; i++){
          codeWordsBits[i] = this.getBits(dataCodeWords[i]);
        }
        
        var datamatrix = new Array(); // Put data in the matrix
        var assigned = new Array();
        
        for (var i=0; i<colsLengthMatrice; i++){
          datamatrix[i] = new Array();
          assigned[i] = new Array();
        }
        
        // Add the bottom-right corner if needed
        if ( ((rowsLengthMatrice * colsLengthMatrice) % 8) == 4) {
          datamatrix[rowsLengthMatrice-2][colsLengthMatrice-2] = 1;
          datamatrix[rowsLengthMatrice-1][colsLengthMatrice-1] = 1;
          datamatrix[rowsLengthMatrice-1][colsLengthMatrice-2] = 0;
          datamatrix[rowsLengthMatrice-2][colsLengthMatrice-1] = 0;
          assigned[rowsLengthMatrice-2][colsLengthMatrice-2] = 1;
          assigned[rowsLengthMatrice-1][colsLengthMatrice-1] = 1;
          assigned[rowsLengthMatrice-1][colsLengthMatrice-2] = 1;
          assigned[rowsLengthMatrice-2][colsLengthMatrice-1] = 1;
        }
        
        // Put the codewords into the matrix
        this.next(0,rowsLengthMatrice,colsLengthMatrice, codeWordsBits, datamatrix, assigned);
        
        // Add the finder pattern
        datamatrix = this.addFinderPattern(datamatrix, rowsRegion, colsRegion, rowsRegionCW, colsRegionCW);
        
        return datamatrix;
      }
    },
    // little endian convertor
    lec:{
      // convert an int
      cInt: function(value, byteCount){
        var le = '';
        for(var i=0; i<byteCount; i++){
          le += String.fromCharCode(value & 0xFF);
          value = value >> 8;
        }
        return le;
      },
      // return a byte string from rgb values 
      cRgb: function(r,g,b){
        return String.fromCharCode(b) + String.fromCharCode(g) + String.fromCharCode(r);
      },
      // return a byte string from a hex string color
      cHexColor: function(hex){
        var v = parseInt('0x' + hex.substr(1));
        var b = v & 0xFF;
        v = v >> 8;
        var g = v & 0xFF;
        var r = v >> 8;
        return(this.cRgb(r,g,b));
      }
    },
    hexToRGB: function(hex){
      var v = parseInt('0x' + hex.substr(1));
      var b = v & 0xFF;
      v = v >> 8;
      var g = v & 0xFF;
      var r = v >> 8;
      return({r:r,g:g,b:b});
    },
    // test if a string is a hexa string color (like #FF0000)
    isHexColor: function (value){
      var r = new RegExp("#[0-91-F]", "gi");
      return  value.match(r);
    },
    // encode data in base64
    base64Encode: function(value) {
      var r = '', c1, c2, c3, b1, b2, b3, b4;
      var k = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      var i = 0;
      while (i < value.length) {
        c1 = value.charCodeAt(i++);
        c2 = value.charCodeAt(i++);
        c3 = value.charCodeAt(i++);
        b1 = c1 >> 2;
        b2 = ((c1 & 3) << 4) | (c2 >> 4);
        b3 = ((c2 & 15) << 2) | (c3 >> 6);
        b4 = c3 & 63;
        if (isNaN(c2)) b3 = b4 = 64;
        else if (isNaN(c3)) b4 = 64;
        r += k.charAt(b1) + k.charAt(b2) + k.charAt(b3) + k.charAt(b4);
      }
      return r;
    },
    // convert a bit string to an array of array of bit char
    bitStringTo2DArray: function( digit ){
      var d = []; d[0] = [];
      for(var i=0; i<digit.length; i++) d[0][i] = digit.charAt(i);
      return(d);
    },
    // clear jQuery Target
    resize: function($container, w){
      $container
        .css("padding", "0px")
        .css("overflow", "auto")
        .css("width", w + "px")
        .html("");
        return $container;
    },
    // bmp barcode renderer
    digitToBmpRenderer: function($container, settings, digit, hri, mw, mh){
      var lines = digit.length;
      var columns = digit[0].length;
      var i = 0;
      var c0 = this.isHexColor(settings.bgColor) ? this.lec.cHexColor(settings.bgColor) : this.lec.cRgb(255,255,255);
      var c1 = this.isHexColor(settings.color) ? this.lec.cHexColor(settings.color) : this.lec.cRgb(0,0,0);
      var bar0 = '';
      var bar1 = '';
        
      // create one bar 0 and 1 of "mw" byte length 
      for(i=0; i<mw; i++){
        bar0 += c0;
        bar1 += c1;
      }
      var bars = '';
    
      var padding = (4 - ((mw * columns * 3) % 4)) % 4; // Padding for 4 byte alignment ("* 3" come from "3 byte to color R, G and B")
      var dataLen = (mw * columns + padding) * mh * lines;
    
      var pad = '';
      for(i=0; i<padding; i++) pad += '\0';
      
      // Bitmap header
      var bmp = 'BM' +                            // Magic Number
                this.lec.cInt(54 + dataLen, 4) +  // Size of Bitmap size (header size + data len)
                '\0\0\0\0' +                      // Unused
                this.lec.cInt(54, 4) +            // The offset where the bitmap data (pixels) can be found
                this.lec.cInt(40, 4) +            // The number of bytes in the header (from this point).
                this.lec.cInt(mw * columns, 4) +  // width
                this.lec.cInt(mh * lines, 4) +    // height
                this.lec.cInt(1, 2) +             // Number of color planes being used
                this.lec.cInt(24, 2) +            // The number of bits/pixel
                '\0\0\0\0' +                      // BI_RGB, No compression used
                this.lec.cInt(dataLen, 4) +       // The size of the raw BMP data (after this header)
                this.lec.cInt(2835, 4) +          // The horizontal resolution of the image (pixels/meter)
                this.lec.cInt(2835, 4) +          // The vertical resolution of the image (pixels/meter)
                this.lec.cInt(0, 4) +             // Number of colors in the palette
                this.lec.cInt(0, 4);              // Means all colors are important
      // Bitmap Data
      for(var y=lines-1; y>=0; y--){
        var line = '';
        for (var x=0; x<columns; x++){
          line += digit[y][x] == '0' ? bar0 : bar1;
        }
        line += pad;
        for(var k=0; k<mh; k++){
          bmp += line;
        }
      }
      // set bmp image to the container
      var object = document.createElement('object');
      object.setAttribute('type', 'image/bmp');
      object.setAttribute('data', 'data:image/bmp;base64,'+ this.base64Encode(bmp));
      this.resize($container, mw * columns + padding).append(object);
                      
    },
    // bmp 1D barcode renderer
    digitToBmp: function($container, settings, digit, hri){
      var w = barcode.intval(settings.barWidth);
      var h = barcode.intval(settings.barHeight);
      this.digitToBmpRenderer($container, settings, this.bitStringTo2DArray(digit), hri, w, h);
    },
    // bmp 2D barcode renderer
    digitToBmp2D: function($container, settings, digit, hri){
      var s = barcode.intval(settings.moduleSize);
      this.digitToBmpRenderer($container, settings, digit, hri, s, s);
    },
    // css barcode renderer
    digitToCssRenderer : function($container, settings, digit, hri, mw, mh){
      var lines = digit.length;
      var columns = digit[0].length;
      var content = "";
      var bar0 = "<div style=\"float: left; font-size: 0px; background-color: " + settings.bgColor + "; height: " + mh + "px; width: &Wpx\"></div>";    
      var bar1 = "<div style=\"float: left; font-size: 0px; width:0; border-left: &Wpx solid " + settings.color + "; height: " + mh + "px;\"></div>";
  
      var len, current;
      for(var y=0; y<lines; y++){
        len = 0;
        current = digit[y][0];
        for (var x=0; x<columns; x++){
          if ( current == digit[y][x] ) {
            len++;
          } else {
            content += (current == '0' ? bar0 : bar1).replace("&W", len * mw);
            current = digit[y][x];
            len=1;
          }
        }
        if (len > 0){
          content += (current == '0' ? bar0 : bar1).replace("&W", len * mw);
        }
      }  
      if (settings.showHRI){
        content += "<div style=\"clear:both; width: 100%; background-color: " + settings.bgColor + "; color: " + settings.color + "; text-align: center; font-size: " + settings.fontSize + "px; margin-top: " + settings.marginHRI + "px;\">"+hri+"</div>";
      }
      this.resize($container, mw * columns).html(content);
    },
    // css 1D barcode renderer  
    digitToCss: function($container, settings, digit, hri){
      var w = barcode.intval(settings.barWidth);
      var h = barcode.intval(settings.barHeight);
      this.digitToCssRenderer($container, settings, this.bitStringTo2DArray(digit), hri, w, h);
    },
    // css 2D barcode renderer
    digitToCss2D: function($container, settings, digit, hri){
      var s = barcode.intval(settings.moduleSize);
      this.digitToCssRenderer($container, settings, digit, hri, s, s);
    },
    // svg barcode renderer
    digitToSvgRenderer: function($container, settings, digit, hri, mw, mh){
      var lines = digit.length;
      var columns = digit[0].length;
      
      var width = mw * columns;
      var height = mh * lines;
      if (settings.showHRI){
        var fontSize = barcode.intval(settings.fontSize);
        height += barcode.intval(settings.marginHRI) + fontSize;
      }
      
      // svg header
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="' + width + '" height="' + height + '">';
      
      // background
      svg += '<rect width="' +  width + '" height="' + height + '" x="0" y="0" fill="' + settings.bgColor + '" />';
      
      var bar1 = '<rect width="&W" height="' + mh + '" x="&X" y="&Y" fill="' + settings.color + '" />';
      
      var len, current;
      for(var y=0; y<lines; y++){
        len = 0;
        current = digit[y][0];
        for (var x=0; x<columns; x++){
          if ( current == digit[y][x] ) {
            len++;
          } else {
            if (current == '1') {
              svg += bar1.replace("&W", len * mw).replace("&X", (x - len) * mw).replace("&Y", y * mh);
            }
            current = digit[y][x];
            len=1;
          }
        }
        if ( (len > 0) && (current == '1') ){
          svg += bar1.replace("&W", len * mw).replace("&X", (columns - len) * mw).replace("&Y", y * mh);
        }
      }
      
      if (settings.showHRI){
        svg += '<g transform="translate(' + Math.floor(width/2) + ' 0)">';
        svg += '<text y="' + (height - Math.floor(fontSize/2)) + '" text-anchor="middle" style="font-family: Arial; font-size: ' + fontSize + 'px;" fill="' + settings.color + '">' + hri + '</text>';
        svg += '</g>';
      }
      // svg footer
      svg += '</svg>';
      
      // create a dom object, flush container and add object to the container
      var object = document.createElement('object');
      object.setAttribute('type', 'image/svg+xml');
      object.setAttribute('data', 'data:image/svg+xml,'+ svg);
      this.resize($container, width).append(object);
    },
    // svg 1D barcode renderer
    digitToSvg: function($container, settings, digit, hri){
      var w = barcode.intval(settings.barWidth);
      var h = barcode.intval(settings.barHeight);
      this.digitToSvgRenderer($container, settings, this.bitStringTo2DArray(digit), hri, w, h);
    },
    // svg 2D barcode renderer
    digitToSvg2D: function($container, settings, digit, hri){
      var s = barcode.intval(settings.moduleSize);
      this.digitToSvgRenderer($container, settings, digit, hri, s, s);
    },
    
    // canvas barcode renderer
    digitToCanvasRenderer : function($container, settings, digit, hri, xi, yi, mw, mh){
      var canvas = $container.get(0);
      if ( !canvas || !canvas.getContext ) return; // not compatible
      
      var lines = digit.length;
      var columns = digit[0].length;
      
      var ctx = canvas.getContext('2d');
      ctx.lineWidth = 1;
      ctx.lineCap = 'butt';
      ctx.fillStyle = settings.bgColor;
      ctx.fillRect (xi, yi, columns * mw, lines * mh);
      
      ctx.fillStyle = settings.color;
      
      for(var y=0; y<lines; y++){
        var len = 0;
        var current = digit[y][0];
        for(var x=0; x<columns; x++){
          if (current == digit[y][x]) {
            len++;
          } else {
            if (current == '1'){
              ctx.fillRect (xi + (x - len) * mw, yi + y * mh, mw * len, mh);
            }
            current = digit[y][x];
            len=1;
          }
        }
        if ( (len > 0) && (current == '1') ){
          ctx.fillRect (xi + (columns - len) * mw, yi + y * mh, mw * len, mh);
        }
      }
      if (settings.showHRI){
        var dim = ctx.measureText(hri);
        ctx.fillText(hri, xi + Math.floor((columns * mw - dim.width)/2), yi + lines * mh + settings.fontSize + settings.marginHRI);
      }
    },
    // canvas 1D barcode renderer
    digitToCanvas: function($container, settings, digit, hri){
      var w  = barcode.intval(settings.barWidth);
      var h = barcode.intval(settings.barHeight);
      var x = barcode.intval(settings.posX);
      var y = barcode.intval(settings.posY);
      this.digitToCanvasRenderer($container, settings, this.bitStringTo2DArray(digit), hri, x, y, w, h);
    },
    // canvas 2D barcode renderer
    digitToCanvas2D: function($container, settings, digit, hri){
      var s = barcode.intval(settings.moduleSize);
      var x = barcode.intval(settings.posX);
      var y = barcode.intval(settings.posY);
      this.digitToCanvasRenderer($container, settings, digit, hri, x, y, s, s);
    }
  };
  
  $.fn.extend({
    barcode: function(datas, type, settings) {
      var digit = "",
          hri   = "",
          code  = "",
          crc   = true,
          rect  = false,
          b2d   = false;
      
      if (typeof(datas) == "string"){
        code = datas;
      } else if (typeof(datas) == "object"){
        code = typeof(datas.code) == "string" ? datas.code : "";
        crc = typeof(datas.crc) != "undefined" ? datas.crc : true;
        rect = typeof(datas.rect) != "undefined" ? datas.rect : false;
      }
      if (code == "") return(false);
      
      if (typeof(settings) == "undefined") settings = [];
      for(var name in barcode.settings){
        if (settings[name] == undefined) settings[name] = barcode.settings[name];
      }
      
      switch(type){
        case "std25":
        case "int25":
          digit = barcode.i25.getDigit(code, crc, type);
          hri = barcode.i25.compute(code, crc, type);
        break;
        case "ean8":
        case "ean13":
          digit = barcode.ean.getDigit(code, type);
          hri = barcode.ean.compute(code, type);
        break;
        case "upc":
          digit = barcode.upc.getDigit(code);
          hri = barcode.upc.compute(code);
        break;
        case "code11":
          digit = barcode.code11.getDigit(code);
          hri = code;
        break;
        case "code39":
          digit = barcode.code39.getDigit(code);
          hri = code;
        break;
        case "code93":
          digit = barcode.code93.getDigit(code, crc);
          hri = code;
        break;
        case "code128":
          digit = barcode.code128.getDigit(code);
          hri = code;
        break;
        case "codabar":
          digit = barcode.codabar.getDigit(code);
          hri = code;
        break;
        case "msi":
          digit = barcode.msi.getDigit(code, crc);
          hri = barcode.msi.compute(code, crc);
        break;
        case "datamatrix":   
          digit = barcode.datamatrix.getDigit(code, rect);
          hri = code;
          b2d = true;
        break; 
      }
      if (digit.length == 0) return($(this));
      
      // Quiet Zone
      if ( !b2d && settings.addQuietZone) digit = "0000000000" + digit + "0000000000";
      
      var $this = $(this);
      var fname = 'digitTo' + settings.output.charAt(0).toUpperCase() + settings.output.substr(1) + (b2d ? '2D' : '');
      if (typeof(barcode[fname]) == 'function') {
        barcode[fname]($this, settings, digit, hri);
      }
      
      return($this);
    }
  });

}(jQuery));


/* jslint browser: true */
/* global jQuery, bdajax, createCookie, readCookie */
// Dependencies: jQuery, cookie_functions.js

(function($, bdajax) {
    "use strict";

    var CART_EXECUTION_CONTEXT = null,
        CART_EXECUTION_URL = null,
        CART_PORTLET_IDENTIFYER = '#portlet-cart',
        CART_VIEWLET_IDENTIFYER = '#cart_viewlet';

    $(document).ready(function() {
        var execution_context = $('.cart_execution_context');
        if (execution_context.length) {
            CART_EXECUTION_CONTEXT = execution_context.text();
        }
        var execution_url = $('#cart');
        if (execution_url.length) {
            CART_EXECUTION_URL = execution_url.data('context-url');
        }
        cart.init();
        cart.query();
        if (window.Faceted !== undefined) {
            $(window.Faceted.Events).bind(window.Faceted.Events.AJAX_QUERY_SUCCESS, function(e){
                cart.bind();
            });
        }
        $.extend(bdajax.binders, {
            cart_binder: cart.bind
        });
    });

    function Cart() {
        // flag whether cart contains items which are no longer available
        this.no_longer_available = false;
        // initially nothing addable, real value gets delivered via cart data
        this.cart_max_article_count = 0;
        // default translation messages
        this.messages = {
            'total_limit_reached': "Total limit reached",
            'not_a_number': "Input not a number",
            'max_unique_articles_reached': "Unique article limit reached",
            'comment_required': "Comment is required",
            'integer_required': "Input not an integer",
            'no_longer_available': "One or more items in cart are only " +
                                   "partly or no longer available. Please " +
                                   "update or remove related items",
            'cart_item_added': "Item has been added to cart",
            'cart_item_updated': "Item has been updated in cart",
            'cart_item_removed': "Item has been removed from cart"
        };
    }

    Cart.prototype.init = function() {
        this.cart_node = $('#cart').get(0);
        if (!this.cart_node) {
            return;
        }
        var template_sel = '#cart_item_template .cart_item';
        this.item_template = $($(template_sel).get(0)).clone();
        $('#cart_item_template').remove();

        this.separator_template = $($('.separator_template').get(0)).clone();
        $('#separato_template').remove();
        this.separators = 0;
    };

    Cart.prototype.add = function(uid, count, comment) {
        if (!this.validateOverallCountAdd(count)) {
            return;
        }
        this.writecookie(uid, count, comment, true);
        this.query(uid);
    };

    Cart.prototype.set = function(uid, count, comment, do_render) {
        if (!this.validateOverallCountSet(uid, count)) {
            return;
        }
        this.writecookie(uid, count, comment, false);

        if (do_render != undefined) {
          this.query(uid, do_render);
        } else {
          this.query(uid);
        }
    };

    Cart.prototype.writecookie = function(uid, count, comment, add) {
        // XXX: support cookie size > 4096 by splitting up cookie
        count = Number(count);
        // item uid consists of ``object_uid;comment``
        uid = uid + ';' + comment;
        var items = this.items();
        var existent = false;
        var itemuid;

        for (itemuid in items) {
            if (!itemuid) {
                continue;
            }
            if (uid === itemuid) {
                if (add) {
                    items[itemuid] += count;
                } else {
                    items[itemuid] = count;
                }
                existent = true;
                break;
            }
        }
        if (!existent) {
            items[uid] = Number(count);
        }
        var cookie = '';
        for (itemuid in items) {
            if (!itemuid || items[itemuid] === 0) {
                continue;
            }
            cookie = cookie + itemuid + ':' + String(items[itemuid]) + ',';
        }
        if (cookie) {
            cookie = cookie.substring(0, cookie.length - 1);
        }
        if (cookie.length > 4096) {
            bdajax.error(cart.messages.max_unique_articles_reached);
            return;
        }
        createCookie('cart', cookie);
    };

    Cart.prototype.render = function(data) {
        this.separators = 0;
        this.cart_max_article_count = data.cart_settings.cart_max_article_count;
        if (data.cart_items.length === 0) {
            if (!data.cart_settings.hide_cart_if_empty) {
                $(CART_PORTLET_IDENTIFYER).css('display', 'block');
                $(CART_VIEWLET_IDENTIFYER).css('display', 'block');
            } else {
                $(CART_PORTLET_IDENTIFYER).css('display', 'none');
                $(CART_VIEWLET_IDENTIFYER).css('display', 'none');
            }
            $('#cart_items', this.cart_node).css('display', 'none');
            $('#cart_no_items', this.cart_node).css('display', 'block');
            $('#cart_summary', this.cart_node).css('display', 'none');
            $('.cart_total_count').html(0);
        } else {
            var there_is_an_event = false;
            $(CART_PORTLET_IDENTIFYER).css('display', 'block');
            $(CART_VIEWLET_IDENTIFYER).css('display', 'block');
            $('#cart_no_items', this.cart_node).css('display', 'none');
            $('#cart_items', this.cart_node).empty();
            $('#cart_items', this.cart_node).css('display', 'table-row-group');
            var render_no_longer_available = false;
            var cart_total_count = 0;
            for (var i = 0; i < data.cart_items.length; i++) {
                var cart_item = $(this.item_template).clone();
                var cart_item_data = data.cart_items[i];
                // item control flags
                var quantity_unit_float = cart_item_data.quantity_unit_float;
                var comment_required = cart_item_data.comment_required;
                var no_longer_available = cart_item_data.no_longer_available;
                // delete item control flags from cart_item_data
                delete cart_item_data.quantity_unit_float;
                delete cart_item_data.comment_required;
                delete cart_item_data.no_longer_available;
                if (no_longer_available) {
                    $('input', cart_item).prop('disabled', true);
                    $('input.cart_item_count', cart_item)
                        .prop('disabled', false)
                        .css('background-color', 'red');
                    render_no_longer_available = true;
                }

                if (cart_item_data['cart_item_ticket'] == true && cart_item_data['cart_item_count'] > 0) {
                  $('.portletCalendar').show();
                  if ($('.time-active').length == 0) {
                    $('.cart_checkout_button').addClass("disabled");
                  }
                  there_is_an_event = true;
                };

                if (cart_item_data['cart_item_ticket'] == true) {
                  $(cart_item).addClass("recurrent-event");
                  $(cart_item).attr("data-uid", cart_item_data['cart_item_uid']);
                };

                for (var item in cart_item_data) {
                    var attribute = '';
                    var css = '.' + item;
                    if (item.indexOf(':') !== -1) {
                        attribute = item.substring(item.indexOf(':') + 1,
                                                   item.length);
                        css = css.substring(0, item.indexOf(':') + 1);
                    }
                    var value = cart_item_data[item];
                    if (item === 'cart_item_comment' && !value) {
                        $('.cart_item_comment_wrapper', cart_item)
                            .hide().find('*').hide();
                    }
                    if (item === 'cart_item_discount' && value === 0) {
                        $('.cart_item_discount_wrapper', cart_item)
                            .hide().find('*').hide();
                    }
                    if (item === 'cart_item_alert') {
                        $('.cart_item_alert', cart_item).show();
                    }
                    if (css === '.cart_item_preview_image' && value === '') {
                        $('.cart_item_preview_image', cart_item).hide();
                    }
                    var is_count = item === 'cart_item_count';
                    if (is_count) {
                        // CUSTOM
                        if (value == 0 && $(this.cart_node).hasClass('checkout')) {
                            $(cart_item).addClass('disable');
                        } else if (value == 0 && cart_item_data['cart_item_ticket'] == true) {
                            $(cart_item).addClass('disable');
                        }
                        cart_total_count += value;
                    }

                    if (item == "cart_item_title") {
                        if (value.indexOf("Teylers Ontmoet") != -1 || value.indexOf("Ontmoet") != -1 || value.indexOf("Lorentz") != -1 || value.indexOf("Museums and") != -1) {
                            this.separators = this.separators + 1;
                        }
                    }

                    var placeholder = $(css, cart_item);
                    $(placeholder).each(function(e) {
                        // case set attribute of element
                        if (attribute !== '') {
                            $(this).attr(attribute, value);
                        // case element is input
                        } else if (this.tagName.toUpperCase() === 'INPUT') {
                            // check if comment and set required class
                            var is_comment = item === 'cart_item_comment';
                            if (is_comment && comment_required) {
                                $(this).addClass('required');
                            }
                            // check if count and set quantity_unit_float class
                            if (is_count && quantity_unit_float) {
                                $(this).addClass('quantity_unit_float');
                                value = cart.round(value);
                            }
                            $(this).attr('value', value);
                            $(this).val(value);
                        // case set element text
                        // CUSTOM
                        } else if (this.tagName.toUpperCase() == 'SELECT') {
                            $(this).find('option[value="' + value + '"]').attr("selected", "selected");
                        } else {
                            // not count element, set value
                            if (!is_count) {
                                $(this).html(value);
                            // if count element has 'style' attribute 'display'
                            // set to 'none', do not change it's value. This is
                            // necessary for cart item removal.
                            } else {
                                var mode = $(this).css('display');
                                if (mode.toLowerCase() !== 'none') {
                                    $(this).html(value);
                                }
                            }
                        }
                    });
                }
                if (this.separators == 1) {
                    var separator_item = $(this.separator_template).clone();
                    $('#cart_items', this.cart_node).append(separator_item);
                }
                
                $('#cart_items', this.cart_node).append(cart_item);
            }
            var cart_summary = $('#cart_summary', this.cart_node).get(0);
            for (var item in data.cart_summary) {
                var css = '.' + item;
                var value = data.cart_summary[item];
                $(css, cart_summary).html(value);
            }
            var discount_sel = '#cart_summary .discount';
            if (data.cart_summary.discount_total_raw > 0) {
                $(discount_sel, this.cart_node).css('display', 'none'); // CUSTOM
            } else {
                $(discount_sel, this.cart_node).css('display', 'none');
            }
            var shipping_sel = '#cart_summary .shipping';
            if (data.cart_settings.include_shipping_costs) {
                $(shipping_sel, this.cart_node).css('display', 'none'); // CUSTOM
            } else {
                $(shipping_sel, this.cart_node).css('display', 'none');
            }
            $('#cart_summary', this.cart_node).css('display', 'block'); // CUSTOM
            $('.cart_total_count').html(cart_total_count);

            if (cart_total_count > 0) {
                if ($('.cart_checkout_button').hasClass('disabled')) {
                  if (there_is_an_event) {
                    if($('.time-active').length) {
                      $('.cart_checkout_button').removeClass('disabled');
                    }
                  } else {
                    $('.cart_checkout_button').removeClass('disabled');
                  }
                }
            } else {
                if (!$('.cart_checkout_button').hasClass('disabled')) {
                  $('.cart_checkout_button').addClass('disabled');
                }
            }
            
            if (render_no_longer_available) {
                this.no_longer_available = true;
                bdajax.warning(cart.messages.no_longer_available);
            } else {
                this.no_longer_available = false;
            }
        }

        if ($(".recurrent-event").length == 1 && !$(this.cart_node).hasClass('checkout')) {
          $(".recurrent-event").attr("style", "display:table-row !important;")
        }
    };

    Cart.prototype.bind = function(context) {
        $('#cart_viewlet_summary a', context)
            .unbind('click')
            .bind('click', function(e) {
                e.preventDefault();
                var container = $(this).closest('#cart_viewlet');
                var cart_wrapper = $('#cart_viewlet_details', container);
                if (cart_wrapper.is(':visible')) {
                    cart_wrapper.hide();
                } else {
                    cart_wrapper.show();
                }
            });
        $('.prevent_if_no_longer_available', context)
            .unbind('click')
            .bind('click', function(e) {
                if (cart.no_longer_available) {
                    e.preventDefault();
                    bdajax.warning(cart.messages.no_longer_available);
                }
            });
        $('.add_cart_item', context).each(function() {
            $(this).unbind('click');
            $(this).bind('click', function(e) {
                e.preventDefault();
                cart.add_cart_item(this);
            });
        });
        $('.update_cart_item', context).each(function() {
            $(this).unbind('click');
            $(this).bind('click', function(e) {
                e.preventDefault();
                cart.update_cart_item(this);
            });
        });

        $('select.cart_item_count:not(.buyable-count)', context).each(function() {
            $(this).unbind('change');
            $(this).bind('change', function(e) {
                e.preventDefault();
                cart.update_cart_item(this);
            });
        });

    };

    Cart.prototype.update_timeslot = function(params) {


      if (CART_EXECUTION_CONTEXT) {
          params.execution_context = CART_EXECUTION_CONTEXT;
      }

      var status_message = false;

      bdajax.request({
          url: CART_EXECUTION_URL + '/validate_cart_item',
          params: params,
          type: 'json',
          success: function(data) {
              if (data.success === false) {
                  window.ajax_req = null;
                  bdajax.info(decodeURIComponent(data.error));
                  if (data.update) {
                      cart.query();
                  }
              } else {
                  window.ajax_req = null;
                  if (params['reset_uid'] != undefined) {
                    cart.set(params['reset_uid'], 0, '', false);
                  }
                  cart.set(params['uid'], params['count'], '', true);
                  var evt = $.Event('cart_modified');
                  evt.uid = params['uid'];
                  evt.count = params['count'];
                  $('*').trigger(evt);
              }
          }
      });
    };

    Cart.prototype.add_timeslot = function(params) {
        
        if (CART_EXECUTION_CONTEXT) {
            params.execution_context = CART_EXECUTION_CONTEXT;
        }

        var status_message = false;
        bdajax.request({
            url: CART_EXECUTION_URL + '/validate_cart_item',
            params: params,
            type: 'json',
            success: function(data) {
                if (data.success === false) {
                    bdajax.info(decodeURIComponent(data.error));
                    if (data.update) {
                        cart.query();
                    }
                } else {
                    cart.add(params['uid'], params['count'], '');
                    var evt = $.Event('cart_modified');
                    evt.uid = params['uid'];
                    evt.count = params['count'];
                    $('*').trigger(evt);
                }
                $('.cart_checkout_button').removeClass('disabled');
            }
        });
    };

    Cart.prototype.add_cart_item = function(node) {
        var defs;
        try {
            defs = cart.extract(node);
        } catch (ex) {
            bdajax.error(ex.message);
            return;
        }
        var uid = defs[0];
        var count = defs[1];
        var items = cart.items();
        for (var item in items) {
            if (!item) {
                continue;
            }
            var item_uid = item.split(';')[0];
            if (uid === item_uid) {
                count += items[item];
            }
        }
        var params = {
            uid: defs[0],
            count: count + '',
            comment: defs[2]
        };
        if (CART_EXECUTION_CONTEXT) {
            params.execution_context = CART_EXECUTION_CONTEXT;
        }
        var $node = $(node);
        var status_message = $node.hasClass('show_status_message');
        bdajax.request({
            url: CART_EXECUTION_URL + '/validate_cart_item',
            params: params,
            type: 'json',
            success: function(data) {
                if (data.success === false) {
                    bdajax.info(decodeURIComponent(data.error));
                    if (data.update) {
                        cart.query();
                    }
                } else {
                    cart.add(defs[0], defs[1], defs[2]);
                    var evt = $.Event('cart_modified');
                    evt.uid = defs[0];
                    evt.count = count;
                    $('*').trigger(evt);
                    if (status_message) {
                        cart.status_message(
                            $node, cart.messages.cart_item_added);
                    }
                }
            }
        });

    };

    Cart.prototype.update_cart_item = function(node) {
        var defs;
        try {
            defs = cart.extract(node);
        } catch (ex) {
            bdajax.error(ex.message);
            return;
        }
        var uid = defs[0];
        var count = defs[1];
        if (count > 0) {
            var items = cart.items();
            for (var item in items) {
                if (!item) {
                    continue;
                }
                if (item === uid + ';' + defs[2]) {
                    continue;
                }
                var item_uid = item.split(';')[0];
                if (uid === item_uid) {
                    count += items[item];
                }
            }
        }
        var params = {
            uid: defs[0],
            count: count + '',
            comment: defs[2]
        };
        if (CART_EXECUTION_CONTEXT) {
            params.execution_context = CART_EXECUTION_CONTEXT;
        }
        var $node = $(node);
        var status_message = $node.hasClass('show_status_message');

        bdajax.request({
            url: CART_EXECUTION_URL + '/validate_cart_item',
            params: params,
            type: 'json',
            success: function(data) {
                if (data.success === false) {
                    window.ajax_req = null;
                    bdajax.info(decodeURIComponent(data.error));

                    if ($node.parents(".cart_item").hasClass("recurrent-event")) {
                      $(".time-row").each(function() {
                        if ($(this).data('stock') < count) {
                          $(this).addClass('time-ua');
                          $(this).removeClass('time-active');
                          $('.cart_checkout_button').addClass('disabled');
                        } else {
                          $(this).removeClass('time-ua');
                        }
                      });
                      //$('.time-row').removeClass("time-active");
                    }

                    if (data.update) {
                        cart.query();
                    }
                } else {
                    window.ajax_req = null;
                    cart.set(defs[0], defs[1], defs[2]);
                    var evt = $.Event('cart_modified');
                    evt.uid = defs[0];
                    evt.count = count;
                    $('*').trigger(evt);
                    if (status_message && defs[1] === 0) {
                        cart.status_message(
                            $node, cart.messages.cart_item_removed);
                    } else if (status_message && defs[1] !== 0) {
                        cart.status_message(
                            $node, cart.messages.cart_item_updated);
                    }

                    if (defs[1] != 0) {
                      if ($node.parents(".cart_item").hasClass("recurrent-event")) {
                        $(".time-row").each(function() {
                          if ($(this).data('stock') < count) {
                            $(this).addClass('time-ua');
                            $(this).removeClass('time-active');
                          } else {
                            $(this).removeClass('time-ua');
                          }
                        });
                        $('.portletCalendar').show();
                        //$('.time-row').removeClass("time-active");
                      }
                    } else {
                      if ($node.parents(".cart_item").hasClass("recurrent-event")) {
                        $('.portletCalendar').hide();
                      }
                    }
                }
            }
        });
    };

    Cart.prototype.round = function(x) {
        var ret = (Math.round(x * 100) / 100).toString();
        ret += (ret.indexOf('.') === -1) ? '.00' : '00';
        return ret.substring(0, ret.indexOf('.') + 3);
    };

    Cart.prototype.find_extraction_parent = function($node) {
        // Find the first parent node, which has a childelement with class
        // cart_item_uid
        var parent = $node.parent();
        if ($('.cart_item_uid', parent).length === 0) {
            return this.find_extraction_parent(parent);
        }
        return parent;
    };

    Cart.prototype.extract = function(node) {
        node = $(node);

        var parent = this.find_extraction_parent(node);
        var uid = $('.cart_item_uid', parent).first().text();
        var count_node = $('.cart_item_count', parent).get(0);

        var count;
        var tagname = count_node.tagName.toUpperCase();
        if (tagname === 'INPUT' || tagname === 'SELECT') {
            count = $(count_node).val();
        } else {
            count = $(count_node).text();
        }
        count = Number(count);
        if (isNaN(count)) {
            throw {
                name: 'Number Required',
                message: cart.messages.not_a_number
            };
        }

        var force_int = !$(count_node).hasClass('quantity_unit_float');
        if (force_int && count > 0 && count % 1 !== 0) {
            throw {
                name: 'Integer Required',
                message: cart.messages.integer_required
            };
        }
        var comment_node = $('.cart_item_comment', parent).get(0);
        var comment = '';
        if (comment_node) {
            if (comment_node.tagName.toUpperCase() === 'INPUT') {
                comment = $(comment_node).val();
                if ($(comment_node).hasClass('required') && !comment.trim()) {
                    throw {
                        name: 'Comment Required',
                        message: cart.messages.comment_required
                    };
                }
            } else {
                comment = $(comment_node).text();
            }
            comment = encodeURIComponent(comment);
        }
        return [uid, count, comment];
    };

    Cart.prototype.cookie = function() {
        // XXX: support cookie size > 4096 by splitting up cookie
        var cookie = readCookie('cart');
        if (cookie === null) {
            cookie = '';
        }
        return cookie;
    };

    /*
     * items is a key/value mapping in format items['obj_uid;comment'] = count
     */
    Cart.prototype.items = function() {
        var cookie = this.cookie();
        var cookieitems = cookie.split(',');
        var items = {};
        for (var i = 0; i < cookieitems.length; i++) {
            var item = cookieitems[i].split(':');
            items[item[0]] = Number(item[1]);
        }
        return items;
    };

    Cart.prototype.validateOverallCountAdd = function(addcount) {
        var count = 0;
        var items = this.items();
        for (var item in items) {
            if (!item) {
                continue;
            }
            count += items[item];
        }
        count += Number(addcount);
        if (count > this.cart_max_article_count + 1) {
            var msg;
            msg = cart.messages.total_limit_reached;
            bdajax.info(decodeURIComponent(msg));
            return false;
        }
        return true;
    };

    Cart.prototype.validateOverallCountSet = function(uid, setcount) {
        var count = 0;
        var items = this.items();
        for (var item in items) {
            if (!item) {
                continue;
            }
            var item_uid = item.split(';')[0];
            if (uid === item_uid) {
                continue;
            }
            count += items[item];
        }
        count += Number(setcount);
        if (count > this.cart_max_article_count + 1) {
            var msg;
            msg = cart.messages.total_limit_reached;
            bdajax.info(decodeURIComponent(msg));
            return false;
        }
        return true;
    };

    Cart.prototype.status_message = function(elem, message) {
        var show_message = function(anchor_elem, status_message) {
            var offset = anchor_elem.offset();
            var width = anchor_elem.width();
            var height = anchor_elem.height();
            var body_width = $('body').width();
            var top = offset.top + height + 3;
            var right = body_width - offset.left - width - 8;
            status_message.css('top', top);
            status_message.css('right', right);
            $('body').append(status_message);
            status_message.fadeIn(500, function() {
                setTimeout(function() {
                    status_message.fadeOut(500, function() {
                        status_message.remove();
                    });
                }, 2000);
            });
        };
        var status_message = $('<div class="cart_status_message"></div>');
        status_message.html(message);
        show_message(elem, status_message);
    };

    /*
     * @param uid_changed: uid of item which was added or set before querying
     */
    Cart.prototype.query = function(uid_changed, do_render) {
        // trigger cart_changed event on elements with
        // css class ``cart_item_${uid_changed}``
        if (uid_changed) {
            var evt = $.Event('cart_changed');
            var selector = '.cart_item_' + uid_changed;
            $(selector).trigger(evt);
        }
        if (!this.cart_node) {
            return;
        }
        if (document.location.href.indexOf('/portal_factory/') !== -1) {
            return;
        }
        var params = {};
        if (CART_EXECUTION_CONTEXT) {
            params.execution_context = CART_EXECUTION_CONTEXT;
        }
        bdajax.request({
            url: CART_EXECUTION_URL + '/cartData',
            params: params,
            type: 'json',
            success: function(data) {
              if (do_render != undefined) {
                if (do_render) {
                  cart.render(data);
                  cart.bind();
                }
              } else {
                cart.render(data);
                cart.bind();
              }
            }
        });
    };

    var cart = new Cart();
    window.bda_plone_cart = cart;


})(jQuery, bdajax);
