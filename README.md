# pegasus

#### The Image Processing Tool based on Electron framework & sharp npm package

<img width="2556" height="1387" alt="image" src="https://github.com/user-attachments/assets/5d760047-deae-43a0-b227-58052a5fcfb4" />


## 1. Requirements

### For Development
- IDE : Visual Studio Code (Recommemded)
- node.js : v22.18.0 (At least version)

```bash
npm install -g electron
```

```bash
npm install --save electron electron-reload electron-rebuild electron-builder sharp sharp-ico sharp-bmp fs imgkit
```
### For Application use

1. Install node.js : https://nodejs.org/

2. Install electron
```bash
npm install -g electron
```

### when electron is not working
```bash
 npm install -g electron
```

### npm update (Recommended)

```bash
npm update
```

#### imgkit is local module.

## 2-1. How to execute

### window
```bash
electron .
```

or

```bash
npm start
```

### linux line-up
```bash
electron . --ozone-platform=x11
```

## 2-2. How to build

```bash
npm run build
```

## 3. Application Specification

### 3-1. Availiable file extension

```bash
png jpg jpeg webp gif bmp ico tiff tif
```

#### 3-2. extension converting

### 3-3. Image Processing

#### resize

#### crop

#### filter

#### rotate

#### paint
