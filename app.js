'use strict';

import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

import {
  OrbitControls
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';

import {
  OBJLoader
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/OBJLoader.js';

import {
  MTLLoader
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/MTLLoader.js';

function main() {
  // create WebGLRenderer
  const canvas = document.querySelector('#canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas
  });

  // create camera
  const fov = 45;
  const aspect = 2;
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 10, 20);

  // create OrbitControls
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0); // OrbitControls로 컨트롤하는 카메라의 시선이 (0, 5, 0)지점에 고정될거임
  controls.update();

  // create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('black');

  // 평면 지오메트리를 만들어서 바닥 역할을 할 메쉬를 생성해 줌.
  {
    const planeSize = 40;

    // 텍스처를 로드하고 생성함
    const loader = new THREE.TextureLoader();
    const texture = loader.load('./image/checker.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping; // 텍스쳐의 수평, 수직 방향의 래핑 유형을 '반복'으로 지정함.
    texture.magFilter = THREE.NearestFilter;
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats); // 수평, 수직 방향의 반복횟수를 각각 20회로 지정함. 왜? 원본의 가로세로가 2*2인데 생성할 메쉬의 사이즈가 40*40이니까 가로, 세로방향으로 각각 20번 반복해서 들어가면 딱 맞지

    // 평면 지오메트리를 생성하고 바닥 메쉬를 만듦
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
      map: texture,
      side: THREE.DoubleSide, // 바닥 메쉬의 양면을 모두 렌더링처리 하도록 지정함.
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -0.5; // 메쉬는 항상 XY축을 기준으로 생성되므로 XZ축을 기준으로 생성하려면 메쉬를 X축을 기준으로 -90도 회전시켜야 함.
    scene.add(mesh);
  }

  // HemisphereLight(반구광) 생성
  {
    const skyColor = 0xB1E1FF; // light blue
    const groundColor = 0xB97A20 // brownish orange
    const intensity = 1;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);
  }

  // DirectionalLight(직사광) 생성
  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(0, 10, 0);
    light.target.position.set(-5, 0, 0);
    scene.add(light);
    scene.add(light.target); // 직사광같은 경우, light.target을 설정해줬으면 target도 따로 scene에 추가해줘야 함.
  }

  // MTLLoader를 생성해서 먼저 mtl 파일을 로드한 뒤, 로드가 끝나면 OBJLoader를 생성해서 obj 파일을 로드하여 mtl을 적용시키고, 로드된 obj를 씬에 추가함. 
  {
    // MTLLoader 객체를 생성한 뒤, load 메소드를 호출하여 mtl 파일을 로드해 옴.
    // 참고로 mtl 파일은 3D 프로그램에서 obj 모델에 적용되었던 재질과 텍스처에 대한 데이터가 담긴 파일형식이라고 보면 됨.
    // obj는 재질에 대한 정보가 포함되어있지 않기 때문에 보통 obj로 export하면 mtl파일도 같이 생성됨.
    const mtlLoader = new MTLLoader();
    /**
     * MTLLoader.load(url, onLoadFn)
     * 
     * MTLLoader도 아래 OBJLoader와 마찬가지로 load 메서드에서 url, onLoad, onProgress, onError 함수를 인자로 받을 수 있음. 
     * 
     * 이 때 onLoad 콜백함수에서 받는 인자는 MTLLoader.MaterialCreator 라는 MaterialCreator 인스턴스로써,
     * mtl에 작성된 텍스처를 로드한다던지, OBJLoader 객체에 setMaterials를 호출하여 재질을 할당해줄 때 사용함.
     */
    mtlLoader.load('./models/windmill/windmill_001.mtl', (mtl) => {
      // MaterialCreator.preload()를 호출하면, mtl파일에 작성된 머티리얼 객체들을 생성하고,
      // mtl에 작성된 텍스처 파일들도 존재한다면 텍스처 파일 로드를 트리거함. 
      // 이 예제의 mtl에는 2개의 material이 존재하고, 각각의 material에는 2~3개의 텍스처 이미지가 사용되고 있음.
      // preload()를 호출함으로써, 2개의 재질이 생성될거고, 각 재질에 해당하는 텍스처 이미지들이 할당될거임.
      // 이 때, 텍스처 파일들과 mtl, obj 파일은 모두 같은 디렉토리 내에 두어야 함.
      mtl.preload();

      /**
       * 이때, mtl파일에서는 각 머티리얼의 THREE.DoubleSide(즉, 양면 렌더링)을 지정하도록 수정할 수 없기 때문에
       * 그냥 바로 코드를 실행해버리면 풍차의 날개 부분이 한 면만 렌더링되는 걸 확인할 수 있음.
       * 
       * 이걸 해결하려면 튜토리얼 웹사이트에 나온 3가지 방법 중 하나를 사용해야 함.
       * mtl 파일에서 날개 부분이 할당하는 재질의 이름이 무엇인지 확인한 뒤,
       * 해당 재질에만 양면 속성을 설정하는 거임.
       * 
       * 가장 단순한거는 모든 재질에 for loop를 돌려 양면 재질을 할당하면 간단하지만, 
       * 양면 렌더링은 단면 렌더링에 비해 성능이 느리기 때문에
       * 안쪽 면이 보이지 않는 부분까지 양면 렌더링을 해주는건 비효율적임... 
       * 
       * 어쨋든 풍차 부분에는 Material이라는 이름의 재질을 사용하고 있으므로, Material.side에 양면 속성을 할당해주면
       * 풍차 날개의 뒷면도 제대로 보이게 될거임.
       */
      mtl.materials.Material.side = THREE.DoubleSide;

      // OBJLoader 객체를 생성한 뒤, load 메소드를 호출하여 obj 파일을 로드해 옴.
      const objLoader = new OBJLoader();
      // mtl.preload()를 호출해서 만든 재질, 그리고 그 안에 로드된 텍스처들을 OBJLoader 인스턴스에 추가해줘야 재질과 텍스처가 적용된 obj 모델이 렌더될거임.
      objLoader.setMaterials(mtl);
      /**
       * OBJLoader.load(url, onLoadFn) 
       * 
       * load 메서드는 정확히는 url, onLoad, onProgress, onError의 총 4개의 인자를 받는데,
       * 여기서는 url, onLoad 콜백함수만 받는 것 같음.
       * 
       * onLoad는 obj 로드가 성공적으로 완료되면 호출하는 콜백함수로, 로드된 obj 요소를 Object3D 객체화된 인자로 받음.
       */
      objLoader.load('./models/windmill/windmill_001.obj', (root) => {
        scene.add(root);
      });
    });

    // 참고로 이렇게 다 해줘도 문제가 하나 남게되는데, 모델을 확대해보면 텍스처가 각져보이는데
    // 이거는 노말맵 텍스처가 제대로 적용되지 않아서 이렇게 보이는거임.
    // mtl 파일의 소스코드를 보면 노말맵의 key 이름이 map_Bump로 되어있는데, 이거는 범프맵에서 써야되는 이름이고,(범프맵이랑 노말맵은 다름)
    // 대신 노말맵의 key는 'norm'으로 지정해줘야 노말맵이 정상적으로 적용될 수 있음.
  }

  // resize renderer
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  // animate
  function animate() {
    // 렌더러가 리사이징 되었다면 카메라의 비율(aspect)도 리사이징된 사이즈에 맞춰서 업데이트 해줘야 함.
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);

    requestAnimationFrame(animate); // 내부적으로 반복 호출해주고
  }

  requestAnimationFrame(animate);
}

main();