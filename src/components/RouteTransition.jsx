import { useEffect, useState } from "react";
import { Routes } from "react-router-dom";

// em vez do corte seco (página antiga some, nova aparece e só então faz fade in),
// primeiro desbota a página atual e só troca pra nova (com o scroll já resetado)
// quando essa saída termina — sem precisar de nenhuma lib de animação
export default function RouteTransition({ location, children }) {
  const [displayLocation, setDisplayLocation] = useState(location);
  const [stage, setStage] = useState("in");

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) setStage("out");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  function handleAnimationEnd() {
    if (stage === "out") {
      // "instant" porque o CSS global tem scroll-behavior:smooth — sem isso o reset
      // vira uma rolagem animada visível brigando com outras coisas (tipo o campo
      // de busca que foca sozinho e tenta se colocar à vista)
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      setDisplayLocation(location);
      setStage("in");
    } else if (stage === "in") {
      // sem isso, a classe com animação de transform (mesmo já parada em transform:none)
      // fica pra sempre no elemento — e qualquer position:fixed dentro dele (modal de
      // corrida, itens do carrinho etc.) passa a se posicionar relativo a essa div em
      // vez da viewport, porque um transform ainda "ativo" cria um containing block novo
      setStage("idle");
    }
  }

  const className = stage === "out" ? "vp-route-out" : stage === "in" ? "vp-route-in" : "";

  return (
    <div className={className} onAnimationEnd={handleAnimationEnd}>
      <Routes location={displayLocation}>{children}</Routes>
    </div>
  );
}
